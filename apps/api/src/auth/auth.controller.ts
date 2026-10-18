import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import type { ZodType } from "zod";
import { AuthService } from "./auth.service";
import {
  challengeCookieName,
  csrfCookieName,
  sessionCookieName,
} from "./auth.constants";
import {
  changePasswordSchema,
  loginSchema,
  registrationSchema,
  totpCodeSchema,
} from "./auth.schemas";
import { SessionAuthGuard } from "./session-auth.guard";
import { CsrfGuard, assertTrustedOrigin } from "./csrf.guard";
import { CurrentActor } from "./current-actor.decorator";
import type {
  AuthenticatedActor,
  CookieReply,
  CookieRequest,
} from "./auth.types";
import { RateLimit } from "../platform/rate-limit.decorator";
import { RateLimitGuard } from "../platform/rate-limit.guard";

function parse<T>(schema: ZodType<T>, body: unknown): T {
  const result = schema.safeParse(body);
  if (!result.success) {
    throw new BadRequestException({
      code: "VALIDATION_ERROR",
      issues: result.error.issues,
    });
  }
  return result.data;
}

function cookieOptions(httpOnly: boolean, expires?: Date) {
  return {
    path: "/",
    httpOnly,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    ...(expires ? { expires } : {}),
  };
}

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("register")
  @RateLimit({ name: "auth-register", limit: 5, windowSeconds: 3600 })
  @UseGuards(RateLimitGuard)
  async register(@Body() body: unknown, @Req() request: CookieRequest) {
    assertTrustedOrigin(request);
    const input = parse(registrationSchema, body);
    return this.auth.register(
      input.invitationToken,
      input.displayName,
      input.password,
    );
  }

  @Post("login")
  @HttpCode(200)
  @RateLimit({ name: "auth-login", limit: 10, windowSeconds: 900 })
  @UseGuards(RateLimitGuard)
  async login(
    @Body() body: unknown,
    @Req() request: CookieRequest,
    @Res({ passthrough: true }) reply: CookieReply,
  ) {
    assertTrustedOrigin(request);
    const input = parse(loginSchema, body);
    const result = await this.auth.login(
      input.email,
      input.password,
      request.headers["user-agent"],
    );
    reply.header("Cache-Control", "no-store");
    if (result.status === "AUTHENTICATED") {
      this.setSessionCookies(reply, result);
      reply.clearCookie(challengeCookieName(), cookieOptions(true));
      return { status: result.status, expiresAt: result.expiresAt };
    }
    reply.setCookie(
      challengeCookieName(),
      result.challengeToken,
      cookieOptions(true, result.expiresAt),
    );
    return { status: result.status, expiresAt: result.expiresAt };
  }

  @Post("mfa/enroll/start")
  @HttpCode(200)
  @RateLimit({ name: "mfa-enroll-start", limit: 10, windowSeconds: 600 })
  @UseGuards(RateLimitGuard)
  async startMfaEnrollment(
    @Req() request: CookieRequest,
    @Res({ passthrough: true }) reply: CookieReply,
  ) {
    assertTrustedOrigin(request);
    const challenge = request.cookies[challengeCookieName()];
    if (!challenge) throw new BadRequestException("MFA challenge is required");
    reply.header("Cache-Control", "no-store");
    return this.auth.startMfaEnrollment(challenge);
  }

  @Post("mfa/enroll/confirm")
  @HttpCode(200)
  @RateLimit({ name: "mfa-enroll-confirm", limit: 10, windowSeconds: 600 })
  @UseGuards(RateLimitGuard)
  async confirmMfaEnrollment(
    @Body() body: unknown,
    @Req() request: CookieRequest,
    @Res({ passthrough: true }) reply: CookieReply,
  ) {
    assertTrustedOrigin(request);
    const challenge = request.cookies[challengeCookieName()];
    if (!challenge) throw new BadRequestException("MFA challenge is required");
    const input = parse(totpCodeSchema, body);
    const session = await this.auth.confirmMfaEnrollment(
      challenge,
      input.code,
      request.headers["user-agent"],
    );
    this.setSessionCookies(reply, session);
    reply.clearCookie(challengeCookieName(), cookieOptions(true));
    reply.header("Cache-Control", "no-store");
    return { status: "AUTHENTICATED", expiresAt: session.expiresAt };
  }

  @Post("mfa/verify")
  @HttpCode(200)
  @RateLimit({ name: "mfa-verify", limit: 10, windowSeconds: 600 })
  @UseGuards(RateLimitGuard)
  async verifyMfa(
    @Body() body: unknown,
    @Req() request: CookieRequest,
    @Res({ passthrough: true }) reply: CookieReply,
  ) {
    assertTrustedOrigin(request);
    const challenge = request.cookies[challengeCookieName()];
    if (!challenge) throw new BadRequestException("MFA challenge is required");
    const input = parse(totpCodeSchema, body);
    const session = await this.auth.verifyMfa(
      challenge,
      input.code,
      request.headers["user-agent"],
    );
    this.setSessionCookies(reply, session);
    reply.clearCookie(challengeCookieName(), cookieOptions(true));
    reply.header("Cache-Control", "no-store");
    return { status: "AUTHENTICATED", expiresAt: session.expiresAt };
  }

  @Get("session")
  @RateLimit({
    name: "auth-session",
    limit: 120,
    windowSeconds: 60,
    identity: "actor",
  })
  @UseGuards(SessionAuthGuard, RateLimitGuard)
  async session(@CurrentActor() actor: AuthenticatedActor) {
    return {
      userId: actor.userId,
      tenantId: actor.tenantId,
      roles: actor.roles,
      mfaVerified: actor.mfaVerified,
      account: await this.auth.account(actor.userId),
    };
  }

  @Post("logout")
  @HttpCode(204)
  @RateLimit({
    name: "auth-logout",
    limit: 20,
    windowSeconds: 60,
    identity: "actor",
  })
  @UseGuards(SessionAuthGuard, RateLimitGuard, CsrfGuard)
  async logout(
    @CurrentActor() actor: AuthenticatedActor,
    @Res({ passthrough: true }) reply: CookieReply,
  ) {
    await this.auth.revokeSession(actor.sessionId);
    this.clearAuthCookies(reply);
  }

  @Post("change-password")
  @HttpCode(204)
  @RateLimit({
    name: "auth-change-password",
    limit: 5,
    windowSeconds: 900,
    identity: "actor",
  })
  @UseGuards(SessionAuthGuard, RateLimitGuard, CsrfGuard)
  async changePassword(
    @CurrentActor() actor: AuthenticatedActor,
    @Body() body: unknown,
  ) {
    const input = parse(changePasswordSchema, body);
    await this.auth.changePassword(
      actor,
      input.currentPassword,
      input.newPassword,
    );
  }

  @Post("logout-all")
  @HttpCode(204)
  @RateLimit({
    name: "auth-logout-all",
    limit: 5,
    windowSeconds: 300,
    identity: "actor",
  })
  @UseGuards(SessionAuthGuard, RateLimitGuard, CsrfGuard)
  async logoutAll(
    @CurrentActor() actor: AuthenticatedActor,
    @Res({ passthrough: true }) reply: CookieReply,
  ) {
    await this.auth.revokeAllSessions(actor.userId);
    this.clearAuthCookies(reply);
  }

  private setSessionCookies(
    reply: CookieReply,
    session: { sessionToken: string; csrfToken: string; expiresAt: Date },
  ) {
    reply.setCookie(
      sessionCookieName(),
      session.sessionToken,
      cookieOptions(true, session.expiresAt),
    );
    reply.setCookie(
      csrfCookieName(),
      session.csrfToken,
      cookieOptions(false, session.expiresAt),
    );
  }

  private clearAuthCookies(reply: CookieReply) {
    reply.clearCookie(sessionCookieName(), cookieOptions(true));
    reply.clearCookie(csrfCookieName(), cookieOptions(false));
    reply.clearCookie(challengeCookieName(), cookieOptions(true));
  }
}
