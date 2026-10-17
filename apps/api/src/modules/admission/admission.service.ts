import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import type {
  AdmissionOutcome,
  RedeemTicketRequest,
  RedeemTicketResponse,
} from "@campuspass/contracts";
import { DomainError, hashCredential } from "@campuspass/domain";
import type { AuthenticatedActor } from "../../auth/auth.types";
import { PrismaService } from "../../platform/prisma.service";
import { runSerializableTransaction } from "../../platform/serializable-transaction";
import { setTenantContext } from "../../platform/tenant-context";

@Injectable()
export class AdmissionService {
  constructor(private readonly prisma: PrismaService) {}

  async redeem(
    actor: AuthenticatedActor,
    input: RedeemTicketRequest,
  ): Promise<RedeemTicketResponse> {
    if (!actor.roles.includes("GATE_STAFF") || !actor.tenantId)
      throw new DomainError("UNAUTHORIZED", "Gate staff access is required");
    const tenantId = actor.tenantId;
    return runSerializableTransaction(this.prisma, async (tx) => {
      await setTenantContext(tx, tenantId, actor.userId);
      const prior = await tx.scanAttempt.findUnique({
        where: { requestId: input.requestId },
      });
      if (
        prior &&
        prior.universityId === tenantId &&
        prior.scannerId === actor.userId
      ) {
        return this.responseFor(prior.outcome, prior.createdAt);
      }

      const now = new Date();
      const assignment = await tx.eventStaff.findFirst({
        where: {
          universityId: tenantId,
          userId: actor.userId,
          eventId: input.eventId,
          gateId: input.gateId,
          role: "GATE_STAFF",
          revokedAt: null,
          validFrom: { lte: now },
          validUntil: { gte: now },
        },
      });
      if (!assignment)
        throw new DomainError(
          "UNAUTHORIZED",
          "Scanner assignment is not active",
        );

      const session = await tx.scanSession.findFirst({
        where: {
          id: input.scannerSessionId,
          universityId: tenantId,
          scannerId: actor.userId,
          eventId: input.eventId,
          gateId: input.gateId,
          endedAt: null,
        },
      });
      if (!session)
        throw new DomainError("UNAUTHORIZED", "Scanner session is not active");

      const credential = await tx.ticketCredential.findFirst({
        where: {
          universityId: tenantId,
          credentialHash: hashCredential(input.credential),
          active: true,
        },
        include: { ticket: true },
      });
      if (!credential) {
        await this.recordAttempt(tx, actor, input, "INVALID_CREDENTIAL", null);
        return this.responseFor("INVALID_CREDENTIAL", now);
      }
      if (credential.ticket.eventId !== input.eventId) {
        await this.recordAttempt(
          tx,
          actor,
          input,
          "WRONG_EVENT",
          credential.ticket.id,
        );
        return this.responseFor("WRONG_EVENT", now);
      }

      const transition = await tx.ticket.updateMany({
        where: {
          id: credential.ticket.id,
          universityId: tenantId,
          eventId: input.eventId,
          status: "ACTIVE",
        },
        data: { status: "CHECKED_IN", checkedInAt: now },
      });
      if (transition.count !== 1) {
        const current = await tx.ticket.findUniqueOrThrow({
          where: { id: credential.ticket.id },
        });
        const outcome: AdmissionOutcome =
          current.status === "CHECKED_IN"
            ? "ALREADY_USED"
            : current.status === "REFUNDED"
              ? "REFUNDED"
              : current.status === "REVOKED"
                ? "REVOKED"
                : current.status === "EXPIRED"
                  ? "EXPIRED"
                  : "INVALID_CREDENTIAL";
        await this.recordAttempt(tx, actor, input, outcome, current.id);
        return this.responseFor(outcome, current.checkedInAt ?? now);
      }

      await tx.admission.create({
        data: {
          universityId: tenantId,
          ticketId: credential.ticket.id,
          eventId: input.eventId,
          gateId: input.gateId,
          scannerId: actor.userId,
          admittedAt: now,
        },
      });
      await this.recordAttempt(
        tx,
        actor,
        input,
        "ADMITTED",
        credential.ticket.id,
      );
      await tx.auditEvent.create({
        data: {
          universityId: tenantId,
          actorId: actor.userId,
          action: "ticket.redeemed",
          targetType: "ticket",
          targetId: credential.ticket.id,
          afterRedacted: { eventId: input.eventId, gateId: input.gateId },
        },
      });
      return this.responseFor("ADMITTED", now);
    });
  }

  private async recordAttempt(
    tx: Prisma.TransactionClient,
    actor: AuthenticatedActor,
    input: RedeemTicketRequest,
    outcome: AdmissionOutcome,
    ticketId: string | null,
  ) {
    await tx.scanAttempt.create({
      data: {
        universityId: actor.tenantId!,
        ticketId,
        eventId: input.eventId,
        gateId: input.gateId,
        scannerId: actor.userId,
        scanSessionId: input.scannerSessionId,
        requestId: input.requestId,
        outcome,
      },
    });
  }

  private responseFor(
    outcome: AdmissionOutcome,
    at: Date,
  ): RedeemTicketResponse {
    const messages: Record<AdmissionOutcome, string> = {
      ADMITTED: "Entry approved",
      ALREADY_USED: "Ticket has already been used",
      WRONG_EVENT: "Ticket is for a different event",
      WRONG_GATE: "Ticket is not valid at this gate",
      REVOKED: "Ticket has been revoked",
      REFUNDED: "Ticket has been refunded",
      EXPIRED: "Ticket has expired",
      UNAUTHORIZED: "Scanner is not authorized",
      INVALID_CREDENTIAL: "Credential is not valid",
    };
    return outcome === "ADMITTED"
      ? { outcome, admittedAt: at.toISOString(), message: messages[outcome] }
      : { outcome, message: messages[outcome] };
  }
}
