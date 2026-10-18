import { ForbiddenException, Injectable } from "@nestjs/common";
import type { AuthenticatedActor } from "../../auth/auth.types";
import { unsealCredential } from "../../platform/credential-vault";
import { PrismaService } from "../../platform/prisma.service";
import { setTenantContext } from "../../platform/tenant-context";

type ProfileUpdate = {
  displayName: string;
  locale: string;
  timezone: string;
};

@Injectable()
export class StudentsService {
  constructor(private readonly prisma: PrismaService) {}

  async dashboard(actor: AuthenticatedActor) {
    const tenantId = this.requireStudentTenant(actor);
    return this.prisma.$transaction(async (tx) => {
      await setTenantContext(tx, tenantId, actor.userId);
      const [user, tickets, orders] = await Promise.all([
        tx.user.findUniqueOrThrow({
          where: { id: actor.userId },
          select: {
            displayName: true,
            emailNormalized: true,
            locale: true,
            timezone: true,
            emailVerifiedAt: true,
            university: { select: { name: true, slug: true } },
          },
        }),
        tx.ticket.findMany({
          where: { ownerId: actor.userId, universityId: tenantId },
          select: {
            id: true,
            status: true,
            issuedAt: true,
            checkedInAt: true,
            event: {
              select: {
                id: true,
                slug: true,
                title: true,
                startsAt: true,
                endsAt: true,
                timezone: true,
                status: true,
                venue: { select: { name: true, addressText: true } },
              },
            },
            ticketType: { select: { name: true } },
            credentials: {
              where: { active: true, revokedAt: null },
              orderBy: { version: "desc" },
              take: 1,
              select: {
                credentialCiphertext: true,
                credentialIv: true,
                credentialAuthTag: true,
              },
            },
          },
          orderBy: { issuedAt: "desc" },
          take: 100,
        }),
        tx.order.findMany({
          where: { buyerId: actor.userId, universityId: tenantId },
          select: {
            id: true,
            status: true,
            currency: true,
            totalMinor: true,
            confirmedAt: true,
            createdAt: true,
            event: { select: { id: true, slug: true, title: true } },
            items: {
              select: {
                quantity: true,
                ticketType: { select: { name: true } },
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 100,
        }),
      ]);

      const safeTickets = tickets.map(({ credentials, ...ticket }) => {
        const credential = credentials[0];
        return {
          ...ticket,
          credential:
            credential && ticket.status === "ACTIVE"
              ? unsealCredential({
                  ciphertext: credential.credentialCiphertext,
                  iv: credential.credentialIv,
                  authTag: credential.credentialAuthTag,
                })
              : null,
        };
      });
      const now = Date.now();
      return {
        profile: {
          displayName: user.displayName,
          email: user.emailNormalized,
          locale: user.locale,
          timezone: user.timezone,
          emailVerified: user.emailVerifiedAt !== null,
          university: user.university,
        },
        summary: {
          activeTickets: safeTickets.filter(
            (ticket) => ticket.status === "ACTIVE",
          ).length,
          upcomingEvents: safeTickets.filter(
            (ticket) =>
              ticket.status === "ACTIVE" &&
              ticket.event.status === "PUBLISHED" &&
              ticket.event.endsAt.getTime() >= now,
          ).length,
          bookings: orders.length,
        },
        tickets: safeTickets,
        orders,
      };
    });
  }

  async updateProfile(actor: AuthenticatedActor, input: ProfileUpdate) {
    const tenantId = this.requireStudentTenant(actor);
    return this.prisma.$transaction(async (tx) => {
      await setTenantContext(tx, tenantId, actor.userId);
      const before = await tx.user.findUniqueOrThrow({
        where: { id: actor.userId },
        select: { displayName: true, locale: true, timezone: true },
      });
      const profile = await tx.user.update({
        where: { id: actor.userId },
        data: input,
        select: { displayName: true, locale: true, timezone: true },
      });
      await tx.auditEvent.create({
        data: {
          universityId: tenantId,
          actorId: actor.userId,
          action: "student.profile.updated",
          targetType: "user",
          targetId: actor.userId,
          beforeRedacted: before,
          afterRedacted: profile,
        },
      });
      return profile;
    });
  }

  private requireStudentTenant(actor: AuthenticatedActor): string {
    if (!actor.roles.includes("STUDENT") || !actor.tenantId) {
      throw new ForbiddenException("Student access is required");
    }
    return actor.tenantId;
  }
}
