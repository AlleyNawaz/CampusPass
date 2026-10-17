CREATE TABLE "rate_limit_buckets" (
    "key_hash" CHAR(64) NOT NULL,
    "window_start" TIMESTAMPTZ(6) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "rate_limit_buckets_pkey" PRIMARY KEY ("key_hash", "window_start"),
    CONSTRAINT "rate_limit_buckets_count_check" CHECK ("count" > 0)
);

CREATE INDEX "rate_limit_buckets_expires_at_idx" ON "rate_limit_buckets"("expires_at");
