import { SetMetadata } from "@nestjs/common";

export const RATE_LIMIT_POLICY = "campuspass:rate-limit-policy";

export type RateLimitPolicy = {
  name: string;
  limit: number;
  windowSeconds: number;
  identity?: "ip" | "actor";
};

export const RateLimit = (policy: RateLimitPolicy) =>
  SetMetadata(RATE_LIMIT_POLICY, policy);
