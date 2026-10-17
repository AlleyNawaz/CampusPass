import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PrismaService } from "../platform/prisma.service";
import { AuthService } from "./auth.service";
import { hashOpaqueToken } from "./auth.crypto";
import { hashPassword } from "./password";

function prismaMock() {
  return {
    user: { findUnique: vi.fn() },
    passwordCredential: { update: vi.fn() },
    roleGrant: { findMany: vi.fn() },
    societyMembership: { findMany: vi.fn() },
    eventStaff: { findMany: vi.fn() },
    authSession: {
      create: vi.fn().mockResolvedValue({}),
      findUnique: vi.fn(),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    authChallenge: {
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      create: vi.fn().mockResolvedValue({}),
    },
  };
}

describe("AuthService identity boundary", () => {
  const priorEnv = { ...process.env };

  beforeEach(() => {
    process.env.NODE_ENV = "test";
    process.env.AUTH_PASSWORD_PEPPER =
      "test-pepper-that-is-at-least-32-characters";
  });

  afterEach(() => {
    process.env = { ...priorEnv };
  });

  it("creates an opaque session for a database-authenticated student", async () => {
    const prisma = prismaMock();
    const passwordHash = await hashPassword("correct-horse-battery-staple");
    prisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      universityId: "tenant-a",
      status: "ACTIVE",
      passwordCredential: {
        userId: "user-1",
        passwordHash,
        failedAttempts: 0,
        lockedUntil: null,
      },
      mfaTotp: null,
    });
    prisma.passwordCredential.update.mockResolvedValue({});
    prisma.roleGrant.findMany.mockResolvedValue([
      {
        role: "STUDENT",
        universityId: "tenant-a",
        scopeType: "UNIVERSITY",
      },
    ]);
    prisma.societyMembership.findMany.mockResolvedValue([]);
    prisma.eventStaff.findMany.mockResolvedValue([]);

    const service = new AuthService(prisma as unknown as PrismaService);
    const result = await service.login(
      "student@example.invalid",
      "correct-horse-battery-staple",
      "test-agent",
    );

    expect(result.status).toBe("AUTHENTICATED");
    expect(prisma.authSession.create).toHaveBeenCalledOnce();
    const stored = prisma.authSession.create.mock.calls[0]?.[0].data;
    expect(stored.userId).toBe("user-1");
    expect(stored.tokenHash).toHaveLength(64);
    expect(stored.csrfTokenHash).toHaveLength(64);
    if (result.status === "AUTHENTICATED") {
      expect(stored.tokenHash).toBe(hashOpaqueToken(result.sessionToken));
      expect(stored.csrfTokenHash).toBe(hashOpaqueToken(result.csrfToken));
      expect(stored).not.toHaveProperty("sessionToken");
    }
  });

  it("derives tenant and roles from current database state and ignores cross-tenant grants", async () => {
    const prisma = prismaMock();
    const now = new Date();
    prisma.authSession.findUnique.mockResolvedValue({
      id: "session-1",
      userId: "user-1",
      tokenHash: hashOpaqueToken("raw-session-token"),
      csrfTokenHash: hashOpaqueToken("csrf-token"),
      userAgentHash: null,
      mfaVerifiedAt: null,
      expiresAt: new Date(now.getTime() + 60_000),
      idleExpiresAt: new Date(now.getTime() + 60_000),
      lastSeenAt: now,
      revokedAt: null,
      user: {
        id: "user-1",
        universityId: "tenant-a",
        status: "ACTIVE",
      },
    });
    prisma.roleGrant.findMany.mockResolvedValue([
      {
        role: "STUDENT",
        universityId: "tenant-a",
        scopeType: "UNIVERSITY",
      },
      {
        role: "UNIVERSITY_ADMIN",
        universityId: "tenant-b",
        scopeType: "UNIVERSITY",
      },
    ]);
    prisma.societyMembership.findMany.mockResolvedValue([]);
    prisma.eventStaff.findMany.mockResolvedValue([]);

    const service = new AuthService(prisma as unknown as PrismaService);
    const actor = await service.authenticateSession("raw-session-token");

    expect(actor.tenantId).toBe("tenant-a");
    expect(actor.roles).toEqual(["STUDENT"]);
    expect(actor.roles).not.toContain("UNIVERSITY_ADMIN");
  });
});
