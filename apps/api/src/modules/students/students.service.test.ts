import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PrismaService } from "../../platform/prisma.service";
import { sealCredential } from "../../platform/credential-vault";
import type { AuthenticatedActor } from "../../auth/auth.types";
import { StudentsService } from "./students.service";

const actor: AuthenticatedActor = {
  userId: "10000000-0000-4000-8000-000000000008",
  tenantId: "10000000-0000-4000-8000-000000000001",
  roles: ["STUDENT"],
  sessionId: "session-1",
  csrfTokenHash: "csrf-hash",
  mfaVerified: false,
};

describe("StudentsService", () => {
  const previousKey = process.env.TICKET_CREDENTIAL_ENCRYPTION_KEY_BASE64;

  beforeEach(() => {
    process.env.TICKET_CREDENTIAL_ENCRYPTION_KEY_BASE64 = Buffer.alloc(
      32,
      9,
    ).toString("base64");
  });

  afterEach(() => {
    process.env.TICKET_CREDENTIAL_ENCRYPTION_KEY_BASE64 = previousKey;
  });

  it("returns only the authenticated student's tenant-scoped wallet", async () => {
    const sealed = sealCredential("cp_test_wallet_credential");
    const tx = {
      $queryRaw: vi.fn().mockResolvedValue([]),
      user: {
        findUniqueOrThrow: vi.fn().mockResolvedValue({
          displayName: "Demo Student",
          emailNormalized: "student@example.invalid",
          locale: "en-PK",
          timezone: "Asia/Karachi",
          emailVerifiedAt: new Date(),
          university: { name: "Demo University", slug: "demo-university" },
        }),
      },
      ticket: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: "ticket-1",
            status: "ACTIVE",
            issuedAt: new Date(),
            checkedInAt: null,
            event: {
              id: "event-1",
              slug: "open-house",
              title: "Open House",
              startsAt: new Date(Date.now() + 60_000),
              endsAt: new Date(Date.now() + 120_000),
              timezone: "Asia/Karachi",
              status: "PUBLISHED",
              venue: { name: "Hall", addressText: "Campus" },
            },
            ticketType: { name: "Free admission" },
            credentials: [
              {
                credentialCiphertext: sealed.ciphertext,
                credentialIv: sealed.iv,
                credentialAuthTag: sealed.authTag,
              },
            ],
          },
        ]),
      },
      order: { findMany: vi.fn().mockResolvedValue([]) },
    };
    const prisma = {
      $transaction: vi.fn(async (callback) => callback(tx)),
    };
    const result = await new StudentsService(
      prisma as unknown as PrismaService,
    ).dashboard(actor);

    expect(tx.ticket.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          ownerId: actor.userId,
          universityId: actor.tenantId,
        },
      }),
    );
    expect(result.tickets[0]?.credential).toBe("cp_test_wallet_credential");
    expect(result.summary.activeTickets).toBe(1);
    expect(tx.$queryRaw).toHaveBeenCalledOnce();
  });

  it("rejects an actor without the student role", async () => {
    const service = new StudentsService({} as PrismaService);
    await expect(
      service.dashboard({ ...actor, roles: ["ORGANIZER"] }),
    ).rejects.toThrow("Student access is required");
  });

  it("updates only allowed profile fields and writes an audit event", async () => {
    const tx = {
      $queryRaw: vi.fn().mockResolvedValue([]),
      user: {
        findUniqueOrThrow: vi.fn().mockResolvedValue({
          displayName: "Before",
          locale: "en-PK",
          timezone: "Asia/Karachi",
        }),
        update: vi.fn().mockResolvedValue({
          displayName: "After",
          locale: "en-PK",
          timezone: "Asia/Karachi",
        }),
      },
      auditEvent: { create: vi.fn().mockResolvedValue({}) },
    };
    const prisma = { $transaction: vi.fn(async (callback) => callback(tx)) };
    const service = new StudentsService(prisma as unknown as PrismaService);
    const result = await service.updateProfile(actor, {
      displayName: "After",
      locale: "en-PK",
      timezone: "Asia/Karachi",
    });

    expect(result.displayName).toBe("After");
    expect(tx.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: actor.userId } }),
    );
    expect(tx.auditEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          universityId: actor.tenantId,
          actorId: actor.userId,
          action: "student.profile.updated",
        }),
      }),
    );
  });
});
