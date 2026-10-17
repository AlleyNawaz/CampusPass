import { createHash } from "node:crypto";
import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "./prisma.service";

@Injectable()
export class RateLimitService {
  constructor(private readonly prisma: PrismaService) {}

  async consume(
    rawKey: string,
    limit: number,
    windowSeconds: number,
    now = new Date(),
  ): Promise<{
    allowed: boolean;
    remaining: number;
    retryAfterSeconds: number;
  }> {
    const windowMs = windowSeconds * 1_000;
    const windowStart = new Date(
      Math.floor(now.getTime() / windowMs) * windowMs,
    );
    const expiresAt = new Date(windowStart.getTime() + windowMs * 2);
    const keyHash = createHash("sha256").update(rawKey).digest("hex");
    const rows = await this.prisma.$queryRaw<
      Array<{ count: number }>
    >(Prisma.sql`
      INSERT INTO rate_limit_buckets (key_hash, window_start, count, expires_at)
      VALUES (${keyHash}, ${windowStart}, 1, ${expiresAt})
      ON CONFLICT (key_hash, window_start) DO UPDATE
        SET count = rate_limit_buckets.count + 1
        WHERE rate_limit_buckets.count < ${limit}
      RETURNING count
    `);
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((windowStart.getTime() + windowMs - now.getTime()) / 1_000),
    );
    const count = rows[0]?.count;
    return {
      allowed: count !== undefined,
      remaining: count === undefined ? 0 : Math.max(0, limit - count),
      retryAfterSeconds,
    };
  }
}
