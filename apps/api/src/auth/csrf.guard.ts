import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { constantTimeHashMatch } from "./auth.crypto";
import type { AuthenticatedRequest, CookieRequest } from "./auth.types";
import { approvedWebOrigins } from "../platform/security.environment";

export function assertTrustedOrigin(request: CookieRequest): void {
  const origin = request.headers.origin;
  if (!origin) {
    if (process.env.NODE_ENV === "production") {
      throw new ForbiddenException("Request origin is required");
    }
    return;
  }
  if (!new Set(approvedWebOrigins()).has(origin)) {
    throw new ForbiddenException("Request origin is not allowed");
  }
}

@Injectable()
export class CsrfGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (["GET", "HEAD", "OPTIONS"].includes(request.method)) return true;
    assertTrustedOrigin(request);
    const value = request.headers["x-csrf-token"];
    const token = Array.isArray(value) ? value[0] : value;
    if (
      !request.actor ||
      !token ||
      !constantTimeHashMatch(token, request.actor.csrfTokenHash)
    ) {
      throw new ForbiddenException("CSRF validation failed");
    }
    return true;
  }
}
