import { Injectable } from "@nestjs/common";
import { Prisma, TicketStatus } from "@prisma/client";
import type {
  FreeRegistrationRequest,
  FreeRegistrationResponse,
} from "@campuspass/contracts";
import {
  createOpaqueCredential,
  DomainError,
  hashCredential,
} from "@campuspass/domain";
import type { DevActor } from "../../platform/dev-actor";
import {
  sealCredential,
  unsealCredential,
} from "../../platform/credential-vault";
import { PrismaService } from "../../platform/prisma.service";

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async createFreeRegistration(
    actor: DevActor,
    input: FreeRegistrationRequest,
    key: string,
  ): Promise<FreeRegistrationResponse> {
    if (actor.role !== "STUDENT")
      throw new DomainError("UNAUTHORIZED", "Student access is required");
    return this.prisma.$transaction(
      async (tx) => {
        const requestHash = hashCredential(JSON.stringify(input));
        const existing = await tx.idempotencyKey.findUnique({
          where: {
            universityId_actorId_operation_key: {
              universityId: actor.tenantId,
              actorId: actor.userId,
              operation: "free-registration",
              key,
            },
          },
        });
        if (existing?.responseJson) {
          if (existing.requestHash !== requestHash)
            throw new DomainError(
              "IDEMPOTENCY_KEY_REUSED",
              "Idempotency key was already used with different input",
            );
          const saved = existing.responseJson as { orderId?: string };
          if (!saved.orderId)
            throw new DomainError(
              "INVALID_STATE",
              "Stored idempotency response is invalid",
            );
          return this.registrationResponse(tx, saved.orderId, actor);
        }

        const tier = await tx.ticketType.findFirst({
          where: { id: input.ticketTypeId, universityId: actor.tenantId },
          include: { event: true },
        });
        if (!tier)
          throw new DomainError(
            "RESOURCE_NOT_FOUND",
            "Ticket type was not found",
          );
        const now = new Date();
        if (
          tier.priceMinor !== 0 ||
          !tier.active ||
          tier.event.status !== "PUBLISHED" ||
          now < tier.salesStart ||
          now > tier.salesEnd
        ) {
          throw new DomainError(
            "RESOURCE_NOT_FOUND",
            "Ticket type was not found",
          );
        }
        const alreadyIssued = await tx.ticket.count({
          where: {
            ownerId: actor.userId,
            ticketTypeId: tier.id,
            status: { notIn: ["REVOKED", "REFUNDED"] },
          },
        });
        if (alreadyIssued + input.quantity > tier.perUserLimit) {
          throw new DomainError(
            "PURCHASE_LIMIT_EXCEEDED",
            "Ticket limit exceeded",
          );
        }

        const updated = await tx.$queryRaw<
          Array<{ issued: number }>
        >(Prisma.sql`
          UPDATE ticket_inventory
          SET issued = issued + ${input.quantity}, updated_at = NOW()
          WHERE ticket_type_id = ${tier.id}::uuid
            AND issued + reserved + ${input.quantity} <= capacity
          RETURNING issued
        `);
        if (updated.length !== 1)
          throw new DomainError("SOLD_OUT", "No ticket inventory remains");

        const order = await tx.order.create({
          data: {
            universityId: actor.tenantId,
            buyerId: actor.userId,
            eventId: tier.eventId,
            currency: tier.currency,
            subtotalMinor: 0,
            feeMinor: 0,
            taxMinor: 0,
            totalMinor: 0,
            status: "CONFIRMED",
            policySnapshot: {
              version: input.policyVersion,
              type: "free-registration",
            },
            confirmedAt: now,
          },
        });
        const item = await tx.orderItem.create({
          data: {
            universityId: actor.tenantId,
            orderId: order.id,
            ticketTypeId: tier.id,
            quantity: input.quantity,
            unitPriceMinor: 0,
            feeMinor: 0,
            taxMinor: 0,
          },
        });

        const tickets: FreeRegistrationResponse["tickets"] = [];
        for (let index = 0; index < input.quantity; index += 1) {
          const credential = createOpaqueCredential();
          const sealed = sealCredential(credential);
          const ticket = await tx.ticket.create({
            data: {
              universityId: actor.tenantId,
              eventId: tier.eventId,
              ticketTypeId: tier.id,
              orderItemId: item.id,
              ownerId: actor.userId,
              status: TicketStatus.ACTIVE,
              issuedAt: now,
              credentials: {
                create: {
                  universityId: actor.tenantId,
                  credentialHash: hashCredential(credential),
                  credentialCiphertext: sealed.ciphertext,
                  credentialIv: sealed.iv,
                  credentialAuthTag: sealed.authTag,
                  version: 1,
                  active: true,
                },
              },
            },
          });
          tickets.push({
            id: ticket.id,
            credential,
            eventId: tier.eventId,
            status: "ACTIVE",
          });
        }

        const response: FreeRegistrationResponse = {
          orderId: order.id,
          status: "CONFIRMED",
          currency: tier.currency,
          totalMinor: 0,
          tickets,
        };
        await tx.auditEvent.create({
          data: {
            universityId: actor.tenantId,
            actorId: actor.userId,
            action: "free_registration.confirmed",
            targetType: "order",
            targetId: order.id,
            afterRedacted: { quantity: input.quantity, eventId: tier.eventId },
          },
        });
        await tx.outboxEvent.create({
          data: {
            universityId: actor.tenantId,
            aggregateType: "order",
            aggregateId: order.id,
            eventType: "order.confirmed.free",
            payload: { orderId: order.id, userId: actor.userId },
          },
        });
        await tx.idempotencyKey.create({
          data: {
            universityId: actor.tenantId,
            actorId: actor.userId,
            operation: "free-registration",
            key,
            requestHash,
            responseJson: { orderId: order.id },
            expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
          },
        });
        return response;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  private async registrationResponse(
    tx: Prisma.TransactionClient,
    orderId: string,
    actor: DevActor,
  ): Promise<FreeRegistrationResponse> {
    const order = await tx.order.findFirst({
      where: {
        id: orderId,
        universityId: actor.tenantId,
        buyerId: actor.userId,
      },
      include: {
        items: {
          include: {
            tickets: {
              include: {
                credentials: {
                  where: { active: true },
                  orderBy: { version: "desc" },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });
    if (!order)
      throw new DomainError("RESOURCE_NOT_FOUND", "Order was not found");

    const tickets = order.items.flatMap((item) =>
      item.tickets.map((ticket) => {
        const credential = ticket.credentials[0];
        if (!credential)
          throw new DomainError(
            "INVALID_STATE",
            "Ticket credential is unavailable",
          );
        return {
          id: ticket.id,
          credential: unsealCredential({
            ciphertext: credential.credentialCiphertext,
            iv: credential.credentialIv,
            authTag: credential.credentialAuthTag,
          }),
          eventId: ticket.eventId,
          status: "ACTIVE" as const,
        };
      }),
    );
    return {
      orderId: order.id,
      status: "CONFIRMED",
      currency: order.currency,
      totalMinor: 0,
      tickets,
    };
  }
}
