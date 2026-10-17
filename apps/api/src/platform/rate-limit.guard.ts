import {
  CanActivate,
  ExecutionContext,
  HttpException,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { AuthenticatedRequest } from "../auth/auth.types";
import {
  RATE_LIMIT_POLICY,
  type RateLimitPolicy,
} from "./rate-limit.decorator";
import { RateLimitService } from "./rate-limit.service";

type RateLimitRequest = AuthenticatedRequest & { ip?: string };
type RateLimitReply = { header(name: string, value: string): void };

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly limiter: RateLimitService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const policy = this.reflector.getAllAndOverride<RateLimitPolicy>(
      RATE_LIMIT_POLICY,
      [context.getHandler(), context.getClass()],
    );
    if (!policy) return true;
    const request = context.switchToHttp().getRequest<RateLimitRequest>();
    const reply = context.switchToHttp().getResponse<RateLimitReply>();
    const identity =
      policy.identity === "actor" && request.actor
        ? `actor:${request.actor.userId}`
        : `ip:${request.ip ?? "unknown"}`;
    const result = await this.limiter.consume(
      `${policy.name}:${identity}`,
      policy.limit,
      policy.windowSeconds,
    );
    reply.header("RateLimit-Limit", String(policy.limit));
    reply.header("RateLimit-Remaining", String(result.remaining));
    if (!result.allowed) {
      reply.header("Retry-After", String(result.retryAfterSeconds));
      throw new HttpException(
        { code: "RATE_LIMITED", message: "Too many requests" },
        429,
      );
    }
    return true;
  }
}
