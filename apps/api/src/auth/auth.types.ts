import type { Role } from "@prisma/client";
import type { IncomingHttpHeaders } from "node:http";

export type AuthenticatedActor = {
  userId: string;
  tenantId: string | null;
  roles: Role[];
  sessionId: string;
  csrfTokenHash: string;
  mfaVerified: boolean;
};

export type CookieRequest = {
  cookies: Record<string, string | undefined>;
  headers: IncomingHttpHeaders;
  method: string;
};

export type CookieOptions = {
  path: string;
  httpOnly: boolean;
  secure: boolean;
  sameSite: "strict";
  expires?: Date;
};

export type CookieReply = {
  header(name: string, value: string): CookieReply;
  setCookie(name: string, value: string, options: CookieOptions): CookieReply;
  clearCookie(name: string, options: CookieOptions): CookieReply;
};

export type AuthenticatedRequest = CookieRequest & {
  actor?: AuthenticatedActor;
};
