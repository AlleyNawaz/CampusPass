import type { ExecutionContext } from "@nestjs/common";
import { ForbiddenException, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Role } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import { hashOpaqueToken } from "./auth.crypto";
import { CsrfGuard } from "./csrf.guard";
import { RolesGuard } from "./roles.guard";
import { SessionAuthGuard } from "./session-auth.guard";
import type { AuthenticatedActor, AuthenticatedRequest } from "./auth.types";
import type { AuthService } from "./auth.service";

const actor: AuthenticatedActor = {
  userId: "10000000-0000-4000-8000-000000000008",
  tenantId: "10000000-0000-4000-8000-000000000001",
  roles: ["STUDENT"],
  sessionId: "10000000-0000-4000-8000-000000000099",
  csrfTokenHash: hashOpaqueToken("csrf-token"),
  mfaVerified: false,
};

function contextFor(request: AuthenticatedRequest): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => function handler() {},
    getClass: () => class TestController {},
  } as unknown as ExecutionContext;
}

describe("authentication and authorization guards", () => {
  it("does not accept the removed synthetic identity headers", async () => {
    const guard = new SessionAuthGuard({} as AuthService);
    const request: AuthenticatedRequest = {
      cookies: {},
      headers: {
        "x-demo-user-id": actor.userId,
        "x-demo-tenant-id": actor.tenantId!,
        "x-demo-role": "STUDENT",
      },
      method: "POST",
    };
    await expect(guard.canActivate(contextFor(request))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it("derives the actor from the server-side session service", async () => {
    const authenticateSession = vi.fn().mockResolvedValue(actor);
    const guard = new SessionAuthGuard({
      authenticateSession,
    } as unknown as AuthService);
    const request: AuthenticatedRequest = {
      cookies: { campuspass_session: "opaque-session" },
      headers: { "user-agent": "test-agent" },
      method: "GET",
    };
    await expect(guard.canActivate(contextFor(request))).resolves.toBe(true);
    expect(authenticateSession).toHaveBeenCalledWith(
      "opaque-session",
      "test-agent",
    );
    expect(request.actor).toEqual(actor);
  });

  it("requires an approved origin and the session-bound CSRF token", () => {
    const guard = new CsrfGuard();
    const valid: AuthenticatedRequest = {
      actor,
      cookies: {},
      headers: {
        origin: "http://localhost:3000",
        "x-csrf-token": "csrf-token",
      },
      method: "POST",
    };
    expect(guard.canActivate(contextFor(valid))).toBe(true);
    expect(() =>
      guard.canActivate(
        contextFor({
          ...valid,
          headers: { ...valid.headers, "x-csrf-token": "wrong" },
        }),
      ),
    ).toThrow(ForbiddenException);
    expect(() =>
      guard.canActivate(
        contextFor({
          ...valid,
          headers: {
            origin: "https://attacker.invalid",
            "x-csrf-token": "csrf-token",
          },
        }),
      ),
    ).toThrow(ForbiddenException);
  });

  it("enforces server-derived roles", () => {
    const reflector = {
      getAllAndOverride: vi
        .fn()
        .mockReturnValue(["UNIVERSITY_ADMIN"] satisfies Role[]),
    } as unknown as Reflector;
    const guard = new RolesGuard(reflector);
    expect(() =>
      guard.canActivate(
        contextFor({ actor, cookies: {}, headers: {}, method: "POST" }),
      ),
    ).toThrow(ForbiddenException);
  });
});
