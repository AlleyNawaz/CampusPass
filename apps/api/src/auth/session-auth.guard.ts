import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { sessionCookieName } from "./auth.constants";
import type { AuthenticatedRequest } from "./auth.types";

@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = request.cookies[sessionCookieName()];
    if (!token) throw new UnauthorizedException("Authentication required");
    request.actor = await this.auth.authenticateSession(
      token,
      request.headers["user-agent"],
    );
    return true;
  }
}
