-- Production authentication primitives. Authentication tokens and CSRF tokens
-- are stored only as SHA-256 hashes; TOTP secrets are encrypted by the API.
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'SOCIETY_MEMBER';

CREATE TYPE "AuthChallengePurpose" AS ENUM ('MFA_VERIFY', 'MFA_ENROLL');

CREATE TABLE "password_credentials" (
    "user_id" UUID NOT NULL,
    "password_hash" TEXT NOT NULL,
    "failed_attempts" INTEGER NOT NULL DEFAULT 0,
    "locked_until" TIMESTAMPTZ(6),
    "password_changed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "password_credentials_pkey" PRIMARY KEY ("user_id")
);

CREATE TABLE "auth_sessions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token_hash" CHAR(64) NOT NULL,
    "csrf_token_hash" CHAR(64) NOT NULL,
    "user_agent_hash" CHAR(64),
    "mfa_verified_at" TIMESTAMPTZ(6),
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "idle_expires_at" TIMESTAMPTZ(6) NOT NULL,
    "last_seen_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "auth_sessions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "auth_challenges" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token_hash" CHAR(64) NOT NULL,
    "purpose" "AuthChallengePurpose" NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "pending_secret_ciphertext" TEXT,
    "pending_secret_iv" VARCHAR(24),
    "pending_secret_auth_tag" VARCHAR(32),
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "consumed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "auth_challenges_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "mfa_totp" (
    "user_id" UUID NOT NULL,
    "secret_ciphertext" TEXT NOT NULL,
    "secret_iv" VARCHAR(24) NOT NULL,
    "secret_auth_tag" VARCHAR(32) NOT NULL,
    "last_used_time_step" INTEGER,
    "enabled_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "mfa_totp_pkey" PRIMARY KEY ("user_id")
);

CREATE UNIQUE INDEX "auth_sessions_token_hash_key" ON "auth_sessions"("token_hash");
CREATE INDEX "auth_sessions_user_id_revoked_at_expires_at_idx" ON "auth_sessions"("user_id", "revoked_at", "expires_at");
CREATE INDEX "auth_sessions_idle_expires_at_idx" ON "auth_sessions"("idle_expires_at");
CREATE UNIQUE INDEX "auth_challenges_token_hash_key" ON "auth_challenges"("token_hash");
CREATE INDEX "auth_challenges_user_id_purpose_expires_at_idx" ON "auth_challenges"("user_id", "purpose", "expires_at");

ALTER TABLE "password_credentials"
  ADD CONSTRAINT "password_credentials_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "auth_sessions"
  ADD CONSTRAINT "auth_sessions_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "auth_challenges"
  ADD CONSTRAINT "auth_challenges_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "mfa_totp"
  ADD CONSTRAINT "mfa_totp_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "auth_challenges"
  ADD CONSTRAINT "auth_challenges_attempts_check" CHECK ("attempts" >= 0 AND "attempts" <= 10);
