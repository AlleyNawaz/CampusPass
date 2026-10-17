import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from "@nestjs/common";
import { Prisma, Role } from "@prisma/client";
import { normalizeEmail } from "@campuspass/validation";
import { PrismaService } from "../platform/prisma.service";
import {
  ACCOUNT_LOCK_MS,
  AUTH_CHALLENGE_TTL_MS,
  MAX_AUTH_ATTEMPTS,
  PRIVILEGED_ROLES,
  SESSION_ABSOLUTE_TTL_MS,
  SESSION_IDLE_TTL_MS,
} from "./auth.constants";
import {
  createOpaqueToken,
  hashOpaqueToken,
  hashOptionalMetadata,
  sealMfaSecret,
  unsealMfaSecret,
} from "./auth.crypto";
import type { AuthenticatedActor } from "./auth.types";
import { hashPassword, verifyPassword } from "./password";
import {
  createMfaEnrollment,
  createMfaEnrollmentUri,
  verifyMfaCode,
} from "./mfa";

type SessionMaterial = {
  sessionToken: string;
  csrfToken: string;
  expiresAt: Date;
};

export type LoginResult =
  | ({ status: "AUTHENTICATED" } & SessionMaterial)
  | {
      status: "MFA_REQUIRED" | "MFA_ENROLLMENT_REQUIRED";
      challengeToken: string;
      expiresAt: Date;
    };

type AuthDb = Prisma.TransactionClient | PrismaService;

@Injectable()
export class AuthService {
  private readonly dummyHash = hashPassword(
    "not-a-real-account-password-used-for-timing-equalization",
  );

  constructor(private readonly prisma: PrismaService) {}

  async register(
    invitationToken: string,
    displayName: string,
    password: string,
  ): Promise<{ status: "REGISTERED" }> {
    const tokenHash = hashOpaqueToken(invitationToken);
    const passwordHash = await hashPassword(password);
    await this.prisma.$transaction(async (tx) => {
      const invitation = await tx.registrationInvitation.findUnique({
        where: { tokenHash },
      });
      if (
        !invitation ||
        invitation.consumedAt ||
        invitation.expiresAt <= new Date()
      ) {
        throw new UnauthorizedException("Invalid or expired invitation");
      }
      const consumed = await tx.registrationInvitation.updateMany({
        where: {
          id: invitation.id,
          consumedAt: null,
          expiresAt: { gt: new Date() },
        },
        data: { consumedAt: new Date() },
      });
      if (consumed.count !== 1) {
        throw new UnauthorizedException("Invalid or expired invitation");
      }
      const user = await tx.user.create({
        data: {
          universityId: invitation.universityId,
          emailNormalized: invitation.emailNormalized,
          displayName,
          status: "ACTIVE",
          emailVerifiedAt: new Date(),
          passwordCredential: { create: { passwordHash } },
        },
      });
      await tx.roleGrant.create({
        data: {
          universityId: invitation.universityId,
          userId: user.id,
          role: invitation.role,
          scopeType: invitation.scopeType,
          scopeId: invitation.scopeId,
        },
      });
    });
    return { status: "REGISTERED" };
  }

  async login(
    email: string,
    password: string,
    userAgent?: string,
  ): Promise<LoginResult> {
    const user = await this.prisma.user.findUnique({
      where: { emailNormalized: normalizeEmail(email) },
      include: { passwordCredential: true, mfaTotp: true },
    });
    const credential = user?.passwordCredential;
    const now = new Date();

    if (credential?.lockedUntil && credential.lockedUntil > now) {
      await verifyPassword(await this.dummyHash, password);
      throw this.invalidCredentials();
    }

    const valid = credential
      ? await verifyPassword(credential.passwordHash, password)
      : await verifyPassword(await this.dummyHash, password);
    if (!user || !credential || !valid || user.status !== "ACTIVE") {
      if (credential) await this.recordFailedLogin(credential.userId);
      throw this.invalidCredentials();
    }

    await this.prisma.passwordCredential.update({
      where: { userId: user.id },
      data: { failedAttempts: 0, lockedUntil: null },
    });

    const roles = await this.activeRoles(user.id, user.universityId, now);
    const requiresMfa = roles.some((role) => PRIVILEGED_ROLES.has(role));
    if (requiresMfa) {
      const purpose = user.mfaTotp?.revokedAt
        ? "MFA_ENROLL"
        : user.mfaTotp
          ? "MFA_VERIFY"
          : "MFA_ENROLL";
      const challenge = await this.createChallenge(user.id, purpose);
      return {
        status:
          purpose === "MFA_VERIFY" ? "MFA_REQUIRED" : "MFA_ENROLLMENT_REQUIRED",
        challengeToken: challenge.token,
        expiresAt: challenge.expiresAt,
      };
    }

    return {
      status: "AUTHENTICATED",
      ...(await this.createSession(this.prisma, user.id, false, userAgent)),
    };
  }

  async startMfaEnrollment(challengeToken: string) {
    const challenge = await this.requireChallenge(challengeToken, "MFA_ENROLL");
    let secret: string;
    if (
      challenge.pendingSecretCiphertext &&
      challenge.pendingSecretIv &&
      challenge.pendingSecretAuthTag
    ) {
      secret = unsealMfaSecret(
        {
          ciphertext: challenge.pendingSecretCiphertext,
          iv: challenge.pendingSecretIv,
          authTag: challenge.pendingSecretAuthTag,
        },
        challenge.userId,
      );
    } else {
      secret = createMfaEnrollment(challenge.user.emailNormalized).secret;
      const sealed = sealMfaSecret(secret, challenge.userId);
      await this.prisma.authChallenge.update({
        where: { id: challenge.id },
        data: {
          pendingSecretCiphertext: sealed.ciphertext,
          pendingSecretIv: sealed.iv,
          pendingSecretAuthTag: sealed.authTag,
        },
      });
    }
    return {
      secret,
      otpauthUri: createMfaEnrollmentUri(
        challenge.user.emailNormalized,
        secret,
      ),
      expiresAt: challenge.expiresAt,
    };
  }

  async confirmMfaEnrollment(
    challengeToken: string,
    code: string,
    userAgent?: string,
  ): Promise<SessionMaterial> {
    const challenge = await this.requireChallenge(challengeToken, "MFA_ENROLL");
    if (
      !challenge.pendingSecretCiphertext ||
      !challenge.pendingSecretIv ||
      !challenge.pendingSecretAuthTag
    ) {
      throw new ForbiddenException("MFA enrollment has not been started");
    }
    const secret = unsealMfaSecret(
      {
        ciphertext: challenge.pendingSecretCiphertext,
        iv: challenge.pendingSecretIv,
        authTag: challenge.pendingSecretAuthTag,
      },
      challenge.userId,
    );
    const timeStep = await verifyMfaCode(secret, code);
    if (timeStep === null) {
      await this.recordFailedChallenge(challenge.id);
      throw new UnauthorizedException("Invalid authentication code");
    }
    const sealed = sealMfaSecret(secret, challenge.userId);
    return this.prisma.$transaction(async (tx) => {
      const consumed = await tx.authChallenge.updateMany({
        where: {
          id: challenge.id,
          consumedAt: null,
          expiresAt: { gt: new Date() },
        },
        data: { consumedAt: new Date() },
      });
      if (consumed.count !== 1) throw this.invalidChallenge();
      await tx.mfaTotp.upsert({
        where: { userId: challenge.userId },
        create: {
          userId: challenge.userId,
          secretCiphertext: sealed.ciphertext,
          secretIv: sealed.iv,
          secretAuthTag: sealed.authTag,
          lastUsedTimeStep: timeStep,
        },
        update: {
          secretCiphertext: sealed.ciphertext,
          secretIv: sealed.iv,
          secretAuthTag: sealed.authTag,
          lastUsedTimeStep: timeStep,
          revokedAt: null,
          enabledAt: new Date(),
        },
      });
      return this.createSession(tx, challenge.userId, true, userAgent);
    });
  }

  async verifyMfa(
    challengeToken: string,
    code: string,
    userAgent?: string,
  ): Promise<SessionMaterial> {
    const challenge = await this.requireChallenge(challengeToken, "MFA_VERIFY");
    const mfa = await this.prisma.mfaTotp.findUnique({
      where: { userId: challenge.userId },
    });
    if (!mfa || mfa.revokedAt) throw this.invalidChallenge();
    const secret = unsealMfaSecret(
      {
        ciphertext: mfa.secretCiphertext,
        iv: mfa.secretIv,
        authTag: mfa.secretAuthTag,
      },
      challenge.userId,
    );
    const timeStep = await verifyMfaCode(
      secret,
      code,
      mfa.lastUsedTimeStep ?? undefined,
    );
    if (timeStep === null) {
      await this.recordFailedChallenge(challenge.id);
      throw new UnauthorizedException("Invalid authentication code");
    }

    return this.prisma.$transaction(async (tx) => {
      const mfaUpdated = await tx.mfaTotp.updateMany({
        where: {
          userId: challenge.userId,
          revokedAt: null,
          lastUsedTimeStep: mfa.lastUsedTimeStep,
        },
        data: { lastUsedTimeStep: timeStep },
      });
      const challengeUpdated = await tx.authChallenge.updateMany({
        where: {
          id: challenge.id,
          consumedAt: null,
          expiresAt: { gt: new Date() },
        },
        data: { consumedAt: new Date() },
      });
      if (mfaUpdated.count !== 1 || challengeUpdated.count !== 1) {
        throw this.invalidChallenge();
      }
      return this.createSession(tx, challenge.userId, true, userAgent);
    });
  }

  async authenticateSession(
    rawToken: string,
    userAgent?: string,
  ): Promise<AuthenticatedActor> {
    const now = new Date();
    const session = await this.prisma.authSession.findUnique({
      where: { tokenHash: hashOpaqueToken(rawToken) },
      include: { user: true },
    });
    if (
      !session ||
      session.revokedAt ||
      session.expiresAt <= now ||
      session.idleExpiresAt <= now ||
      session.user.status !== "ACTIVE"
    ) {
      throw new UnauthorizedException("Authentication required");
    }
    const requestUserAgentHash = hashOptionalMetadata(userAgent);
    if (
      session.userAgentHash &&
      session.userAgentHash !== requestUserAgentHash
    ) {
      await this.revokeSession(session.id);
      throw new UnauthorizedException("Authentication required");
    }

    const roles = await this.activeRoles(
      session.userId,
      session.user.universityId,
      now,
    );
    const privileged = roles.some((role) => PRIVILEGED_ROLES.has(role));
    if (privileged && !session.mfaVerifiedAt) {
      await this.revokeSession(session.id);
      throw new UnauthorizedException("Multi-factor authentication required");
    }

    if (now.getTime() - session.lastSeenAt.getTime() > 5 * 60 * 1000) {
      const idleExpiresAt = new Date(
        Math.min(
          now.getTime() + SESSION_IDLE_TTL_MS,
          session.expiresAt.getTime(),
        ),
      );
      await this.prisma.authSession.updateMany({
        where: { id: session.id, revokedAt: null },
        data: { lastSeenAt: now, idleExpiresAt },
      });
    }

    return {
      userId: session.userId,
      tenantId: session.user.universityId,
      roles,
      sessionId: session.id,
      csrfTokenHash: session.csrfTokenHash,
      mfaVerified: session.mfaVerifiedAt !== null,
    };
  }

  async revokeSession(sessionId: string): Promise<void> {
    await this.prisma.authSession.updateMany({
      where: { id: sessionId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllSessions(userId: string): Promise<void> {
    await this.prisma.authSession.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private async activeRoles(
    userId: string,
    tenantId: string | null,
    now: Date,
  ): Promise<Role[]> {
    const [grants, memberships, staffAssignments] = await Promise.all([
      this.prisma.roleGrant.findMany({
        where: {
          userId,
          revokedAt: null,
          validFrom: { lte: now },
          OR: [{ validUntil: null }, { validUntil: { gte: now } }],
        },
        select: { role: true, universityId: true, scopeType: true },
      }),
      this.prisma.societyMembership.findMany({
        where: {
          userId,
          active: true,
          revokedAt: null,
          OR: [{ expiresAt: null }, { expiresAt: { gte: now } }],
        },
        select: { role: true, universityId: true },
      }),
      this.prisma.eventStaff.findMany({
        where: {
          userId,
          revokedAt: null,
          validFrom: { lte: now },
          validUntil: { gte: now },
        },
        select: { role: true, universityId: true },
      }),
    ]);
    return [
      ...new Set([
        ...grants
          .filter(
            (grant) =>
              grant.universityId === tenantId ||
              (grant.scopeType === "PLATFORM" && grant.universityId === null),
          )
          .map(({ role }) => role),
        ...memberships
          .filter((membership) => membership.universityId === tenantId)
          .map(({ role }) => role),
        ...staffAssignments
          .filter((assignment) => assignment.universityId === tenantId)
          .map(({ role }) => role),
      ]),
    ];
  }

  private async createSession(
    db: AuthDb,
    userId: string,
    mfaVerified: boolean,
    userAgent?: string,
  ): Promise<SessionMaterial> {
    const sessionToken = createOpaqueToken();
    const csrfToken = createOpaqueToken();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + SESSION_ABSOLUTE_TTL_MS);
    await db.authSession.create({
      data: {
        userId,
        tokenHash: hashOpaqueToken(sessionToken),
        csrfTokenHash: hashOpaqueToken(csrfToken),
        userAgentHash: hashOptionalMetadata(userAgent),
        mfaVerifiedAt: mfaVerified ? now : null,
        expiresAt,
        idleExpiresAt: new Date(now.getTime() + SESSION_IDLE_TTL_MS),
      },
    });
    return { sessionToken, csrfToken, expiresAt };
  }

  private async createChallenge(
    userId: string,
    purpose: "MFA_VERIFY" | "MFA_ENROLL",
  ) {
    const now = new Date();
    await this.prisma.authChallenge.updateMany({
      where: { userId, consumedAt: null },
      data: { consumedAt: now },
    });
    const token = createOpaqueToken();
    const expiresAt = new Date(now.getTime() + AUTH_CHALLENGE_TTL_MS);
    await this.prisma.authChallenge.create({
      data: { userId, purpose, tokenHash: hashOpaqueToken(token), expiresAt },
    });
    return { token, expiresAt };
  }

  private async requireChallenge(
    rawToken: string,
    purpose: "MFA_VERIFY" | "MFA_ENROLL",
  ) {
    const challenge = await this.prisma.authChallenge.findUnique({
      where: { tokenHash: hashOpaqueToken(rawToken) },
      include: { user: true },
    });
    if (
      !challenge ||
      challenge.purpose !== purpose ||
      challenge.consumedAt ||
      challenge.expiresAt <= new Date() ||
      challenge.attempts >= MAX_AUTH_ATTEMPTS ||
      challenge.user.status !== "ACTIVE"
    ) {
      throw this.invalidChallenge();
    }
    return challenge;
  }

  private async recordFailedLogin(userId: string): Promise<void> {
    const credential = await this.prisma.passwordCredential.update({
      where: { userId },
      data: { failedAttempts: { increment: 1 } },
      select: { failedAttempts: true },
    });
    if (credential.failedAttempts >= MAX_AUTH_ATTEMPTS) {
      await this.prisma.passwordCredential.update({
        where: { userId },
        data: {
          failedAttempts: 0,
          lockedUntil: new Date(Date.now() + ACCOUNT_LOCK_MS),
        },
      });
    }
  }

  private async recordFailedChallenge(challengeId: string): Promise<void> {
    await this.prisma.authChallenge.updateMany({
      where: { id: challengeId, consumedAt: null },
      data: { attempts: { increment: 1 } },
    });
  }

  private invalidCredentials(): UnauthorizedException {
    return new UnauthorizedException("Invalid email or password");
  }

  private invalidChallenge(): UnauthorizedException {
    return new UnauthorizedException("Authentication challenge is invalid");
  }
}
