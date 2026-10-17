CREATE TABLE "registration_invitations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "token_hash" CHAR(64) NOT NULL,
    "university_id" UUID NOT NULL,
    "email_normalized" VARCHAR(320) NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'STUDENT',
    "scope_type" "GrantScope" NOT NULL DEFAULT 'UNIVERSITY',
    "scope_id" UUID,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "consumed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "registration_invitations_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "registration_invitations_university_id_fkey"
      FOREIGN KEY ("university_id") REFERENCES "universities"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "registration_invitations_token_hash_key"
  ON "registration_invitations"("token_hash");
CREATE INDEX "registration_invitations_university_email_expires_idx"
  ON "registration_invitations"("university_id", "email_normalized", "expires_at");
