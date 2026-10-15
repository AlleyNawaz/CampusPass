-- CreateEnum
CREATE TYPE "UniversityStatus" AS ENUM ('DRAFT', 'ACTIVE', 'SUSPENDED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'DELETION_PENDING', 'ANONYMIZED');

-- CreateEnum
CREATE TYPE "SocietyStatus" AS ENUM ('APPLIED', 'APPROVED', 'REJECTED', 'SUSPENDED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('STUDENT', 'ORGANIZER', 'SOCIETY_ADMIN', 'FINANCE_MANAGER', 'GATE_STAFF', 'UNIVERSITY_ADMIN', 'PLATFORM_ADMIN', 'SUPPORT');

-- CreateEnum
CREATE TYPE "GrantScope" AS ENUM ('PLATFORM', 'UNIVERSITY', 'SOCIETY', 'EVENT');

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'PUBLISHED', 'COMPLETED', 'REJECTED', 'CANCELLED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "EventVisibility" AS ENUM ('PUBLIC', 'CAMPUS_ONLY', 'INVITE_ONLY');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('CREATED', 'RESERVED', 'PAYMENT_PENDING', 'PAID', 'CONFIRMED', 'FULFILLED', 'EXPIRED', 'FAILED', 'CANCELLED', 'PARTIALLY_REFUNDED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('ACTIVE', 'CHECKED_IN', 'TRANSFERRED_OUT', 'REFUNDED', 'REVOKED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "AdmissionOutcome" AS ENUM ('ADMITTED', 'ALREADY_USED', 'WRONG_EVENT', 'WRONG_GATE', 'REVOKED', 'REFUNDED', 'EXPIRED', 'UNAUTHORIZED', 'INVALID_CREDENTIAL');

-- CreateEnum
CREATE TYPE "OutboxStatus" AS ENUM ('PENDING', 'PROCESSING', 'PUBLISHED', 'FAILED');

-- CreateTable
CREATE TABLE "universities" (
    "id" UUID NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "status" "UniversityStatus" NOT NULL DEFAULT 'DRAFT',
    "timezone" VARCHAR(100) NOT NULL DEFAULT 'Asia/Karachi',
    "country_code" CHAR(2) NOT NULL DEFAULT 'PK',
    "settings" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "universities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campuses" (
    "id" UUID NOT NULL,
    "university_id" UUID NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "timezone" VARCHAR(100) NOT NULL DEFAULT 'Asia/Karachi',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "campuses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "university_id" UUID,
    "email_normalized" VARCHAR(320) NOT NULL,
    "display_name" VARCHAR(120) NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'PENDING',
    "locale" VARCHAR(20) NOT NULL DEFAULT 'en-PK',
    "timezone" VARCHAR(100) NOT NULL DEFAULT 'Asia/Karachi',
    "email_verified_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "societies" (
    "id" UUID NOT NULL,
    "university_id" UUID NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "status" "SocietyStatus" NOT NULL DEFAULT 'APPLIED',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "societies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "society_memberships" (
    "id" UUID NOT NULL,
    "university_id" UUID NOT NULL,
    "society_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" "Role" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "expires_at" TIMESTAMPTZ(6),
    "revoked_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "society_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_grants" (
    "id" UUID NOT NULL,
    "university_id" UUID,
    "user_id" UUID NOT NULL,
    "role" "Role" NOT NULL,
    "scope_type" "GrantScope" NOT NULL,
    "scope_id" UUID,
    "valid_from" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "valid_until" TIMESTAMPTZ(6),
    "revoked_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "role_grants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "venues" (
    "id" UUID NOT NULL,
    "university_id" UUID NOT NULL,
    "campus_id" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "capacity" INTEGER NOT NULL,
    "address_text" TEXT NOT NULL,
    "accessibility_notes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "venues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "venue_gates" (
    "id" UUID NOT NULL,
    "university_id" UUID NOT NULL,
    "venue_id" UUID NOT NULL,
    "label" VARCHAR(100) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "venue_gates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" UUID NOT NULL,
    "university_id" UUID NOT NULL,
    "campus_id" UUID NOT NULL,
    "society_id" UUID NOT NULL,
    "venue_id" UUID NOT NULL,
    "slug" VARCHAR(140) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT NOT NULL,
    "status" "EventStatus" NOT NULL DEFAULT 'DRAFT',
    "visibility" "EventVisibility" NOT NULL DEFAULT 'CAMPUS_ONLY',
    "starts_at" TIMESTAMPTZ(6) NOT NULL,
    "ends_at" TIMESTAMPTZ(6) NOT NULL,
    "timezone" VARCHAR(100) NOT NULL DEFAULT 'Asia/Karachi',
    "capacity" INTEGER NOT NULL,
    "policy_version" VARCHAR(100) NOT NULL DEFAULT 'draft-v1',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_types" (
    "id" UUID NOT NULL,
    "university_id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "price_minor" INTEGER NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'PKR',
    "per_user_limit" INTEGER NOT NULL DEFAULT 1,
    "sales_start" TIMESTAMPTZ(6) NOT NULL,
    "sales_end" TIMESTAMPTZ(6) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "ticket_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_inventory" (
    "id" UUID NOT NULL,
    "university_id" UUID NOT NULL,
    "ticket_type_id" UUID NOT NULL,
    "capacity" INTEGER NOT NULL,
    "reserved" INTEGER NOT NULL DEFAULT 0,
    "issued" INTEGER NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "ticket_inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" UUID NOT NULL,
    "university_id" UUID NOT NULL,
    "buyer_id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "currency" CHAR(3) NOT NULL,
    "subtotal_minor" INTEGER NOT NULL,
    "fee_minor" INTEGER NOT NULL,
    "tax_minor" INTEGER NOT NULL,
    "total_minor" INTEGER NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'CREATED',
    "policy_snapshot" JSONB NOT NULL,
    "confirmed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" UUID NOT NULL,
    "university_id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "ticket_type_id" UUID NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price_minor" INTEGER NOT NULL,
    "fee_minor" INTEGER NOT NULL,
    "tax_minor" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tickets" (
    "id" UUID NOT NULL,
    "university_id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "ticket_type_id" UUID NOT NULL,
    "order_item_id" UUID NOT NULL,
    "owner_id" UUID NOT NULL,
    "status" "TicketStatus" NOT NULL DEFAULT 'ACTIVE',
    "issued_at" TIMESTAMPTZ(6) NOT NULL,
    "checked_in_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_credentials" (
    "id" UUID NOT NULL,
    "university_id" UUID NOT NULL,
    "ticket_id" UUID NOT NULL,
    "credential_hash" CHAR(64) NOT NULL,
    "credential_ciphertext" TEXT NOT NULL,
    "credential_iv" VARCHAR(24) NOT NULL,
    "credential_auth_tag" VARCHAR(32) NOT NULL,
    "version" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "revoked_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "ticket_credentials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_staff" (
    "id" UUID NOT NULL,
    "university_id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "gate_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'GATE_STAFF',
    "valid_from" TIMESTAMPTZ(6) NOT NULL,
    "valid_until" TIMESTAMPTZ(6) NOT NULL,
    "revoked_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "event_staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scan_sessions" (
    "id" UUID NOT NULL,
    "university_id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "gate_id" UUID NOT NULL,
    "scanner_id" UUID NOT NULL,
    "device_label" VARCHAR(100) NOT NULL,
    "started_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "scan_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admissions" (
    "id" UUID NOT NULL,
    "university_id" UUID NOT NULL,
    "ticket_id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "gate_id" UUID NOT NULL,
    "scanner_id" UUID NOT NULL,
    "admitted_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "admissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scan_attempts" (
    "id" UUID NOT NULL,
    "university_id" UUID NOT NULL,
    "ticket_id" UUID,
    "event_id" UUID NOT NULL,
    "gate_id" UUID NOT NULL,
    "scanner_id" UUID NOT NULL,
    "scan_session_id" UUID NOT NULL,
    "request_id" UUID NOT NULL,
    "outcome" "AdmissionOutcome" NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "scan_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_events" (
    "id" UUID NOT NULL,
    "university_id" UUID,
    "actor_id" UUID,
    "action" VARCHAR(160) NOT NULL,
    "target_type" VARCHAR(100) NOT NULL,
    "target_id" UUID NOT NULL,
    "before_redacted" JSONB,
    "after_redacted" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outbox_events" (
    "id" UUID NOT NULL,
    "university_id" UUID,
    "aggregate_type" VARCHAR(100) NOT NULL,
    "aggregate_id" UUID NOT NULL,
    "event_type" VARCHAR(160) NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "OutboxStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "available_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "published_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "outbox_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "idempotency_keys" (
    "id" UUID NOT NULL,
    "university_id" UUID NOT NULL,
    "actor_id" UUID NOT NULL,
    "operation" VARCHAR(100) NOT NULL,
    "key" VARCHAR(200) NOT NULL,
    "request_hash" CHAR(64) NOT NULL,
    "response_json" JSONB,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "idempotency_keys_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "universities_slug_key" ON "universities"("slug");

-- CreateIndex
CREATE INDEX "campuses_university_id_active_idx" ON "campuses"("university_id", "active");

-- CreateIndex
CREATE UNIQUE INDEX "campuses_university_id_slug_key" ON "campuses"("university_id", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_normalized_key" ON "users"("email_normalized");

-- CreateIndex
CREATE INDEX "users_university_id_status_idx" ON "users"("university_id", "status");

-- CreateIndex
CREATE INDEX "societies_university_id_status_idx" ON "societies"("university_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "societies_university_id_slug_key" ON "societies"("university_id", "slug");

-- CreateIndex
CREATE INDEX "society_memberships_university_id_user_id_active_idx" ON "society_memberships"("university_id", "user_id", "active");

-- CreateIndex
CREATE UNIQUE INDEX "society_memberships_society_id_user_id_role_key" ON "society_memberships"("society_id", "user_id", "role");

-- CreateIndex
CREATE INDEX "role_grants_university_id_user_id_role_revoked_at_idx" ON "role_grants"("university_id", "user_id", "role", "revoked_at");

-- CreateIndex
CREATE INDEX "venues_university_id_active_idx" ON "venues"("university_id", "active");

-- CreateIndex
CREATE UNIQUE INDEX "venues_campus_id_name_key" ON "venues"("campus_id", "name");

-- CreateIndex
CREATE INDEX "venue_gates_university_id_active_idx" ON "venue_gates"("university_id", "active");

-- CreateIndex
CREATE UNIQUE INDEX "venue_gates_venue_id_label_key" ON "venue_gates"("venue_id", "label");

-- CreateIndex
CREATE INDEX "events_university_id_status_visibility_starts_at_idx" ON "events"("university_id", "status", "visibility", "starts_at");

-- CreateIndex
CREATE UNIQUE INDEX "events_university_id_slug_key" ON "events"("university_id", "slug");

-- CreateIndex
CREATE INDEX "ticket_types_university_id_event_id_active_idx" ON "ticket_types"("university_id", "event_id", "active");

-- CreateIndex
CREATE UNIQUE INDEX "ticket_types_event_id_name_key" ON "ticket_types"("event_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "ticket_inventory_ticket_type_id_key" ON "ticket_inventory"("ticket_type_id");

-- CreateIndex
CREATE INDEX "ticket_inventory_university_id_ticket_type_id_idx" ON "ticket_inventory"("university_id", "ticket_type_id");

-- CreateIndex
CREATE INDEX "orders_university_id_buyer_id_created_at_idx" ON "orders"("university_id", "buyer_id", "created_at");

-- CreateIndex
CREATE INDEX "orders_university_id_event_id_status_idx" ON "orders"("university_id", "event_id", "status");

-- CreateIndex
CREATE INDEX "order_items_university_id_order_id_idx" ON "order_items"("university_id", "order_id");

-- CreateIndex
CREATE INDEX "tickets_university_id_owner_id_status_idx" ON "tickets"("university_id", "owner_id", "status");

-- CreateIndex
CREATE INDEX "tickets_university_id_event_id_status_idx" ON "tickets"("university_id", "event_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ticket_credentials_credential_hash_key" ON "ticket_credentials"("credential_hash");

-- CreateIndex
CREATE INDEX "ticket_credentials_university_id_credential_hash_active_idx" ON "ticket_credentials"("university_id", "credential_hash", "active");

-- CreateIndex
CREATE UNIQUE INDEX "ticket_credentials_ticket_id_version_key" ON "ticket_credentials"("ticket_id", "version");

-- CreateIndex
CREATE INDEX "event_staff_university_id_user_id_revoked_at_valid_until_idx" ON "event_staff"("university_id", "user_id", "revoked_at", "valid_until");

-- CreateIndex
CREATE UNIQUE INDEX "event_staff_event_id_gate_id_user_id_key" ON "event_staff"("event_id", "gate_id", "user_id");

-- CreateIndex
CREATE INDEX "scan_sessions_university_id_scanner_id_ended_at_idx" ON "scan_sessions"("university_id", "scanner_id", "ended_at");

-- CreateIndex
CREATE UNIQUE INDEX "admissions_ticket_id_key" ON "admissions"("ticket_id");

-- CreateIndex
CREATE INDEX "admissions_university_id_event_id_admitted_at_idx" ON "admissions"("university_id", "event_id", "admitted_at");

-- CreateIndex
CREATE UNIQUE INDEX "scan_attempts_request_id_key" ON "scan_attempts"("request_id");

-- CreateIndex
CREATE INDEX "scan_attempts_university_id_event_id_created_at_idx" ON "scan_attempts"("university_id", "event_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_events_university_id_created_at_idx" ON "audit_events"("university_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_events_target_type_target_id_created_at_idx" ON "audit_events"("target_type", "target_id", "created_at");

-- CreateIndex
CREATE INDEX "outbox_events_status_available_at_idx" ON "outbox_events"("status", "available_at");

-- CreateIndex
CREATE INDEX "outbox_events_university_id_aggregate_type_aggregate_id_idx" ON "outbox_events"("university_id", "aggregate_type", "aggregate_id");

-- CreateIndex
CREATE INDEX "idempotency_keys_expires_at_idx" ON "idempotency_keys"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "idempotency_keys_university_id_actor_id_operation_key_key" ON "idempotency_keys"("university_id", "actor_id", "operation", "key");

-- AddForeignKey
ALTER TABLE "campuses" ADD CONSTRAINT "campuses_university_id_fkey" FOREIGN KEY ("university_id") REFERENCES "universities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_university_id_fkey" FOREIGN KEY ("university_id") REFERENCES "universities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "societies" ADD CONSTRAINT "societies_university_id_fkey" FOREIGN KEY ("university_id") REFERENCES "universities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "society_memberships" ADD CONSTRAINT "society_memberships_society_id_fkey" FOREIGN KEY ("society_id") REFERENCES "societies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "society_memberships" ADD CONSTRAINT "society_memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_grants" ADD CONSTRAINT "role_grants_university_id_fkey" FOREIGN KEY ("university_id") REFERENCES "universities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_grants" ADD CONSTRAINT "role_grants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "venues" ADD CONSTRAINT "venues_university_id_fkey" FOREIGN KEY ("university_id") REFERENCES "universities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "venues" ADD CONSTRAINT "venues_campus_id_fkey" FOREIGN KEY ("campus_id") REFERENCES "campuses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "venue_gates" ADD CONSTRAINT "venue_gates_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "venues"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_university_id_fkey" FOREIGN KEY ("university_id") REFERENCES "universities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_campus_id_fkey" FOREIGN KEY ("campus_id") REFERENCES "campuses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_society_id_fkey" FOREIGN KEY ("society_id") REFERENCES "societies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "venues"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_types" ADD CONSTRAINT "ticket_types_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_inventory" ADD CONSTRAINT "ticket_inventory_ticket_type_id_fkey" FOREIGN KEY ("ticket_type_id") REFERENCES "ticket_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_university_id_fkey" FOREIGN KEY ("university_id") REFERENCES "universities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_ticket_type_id_fkey" FOREIGN KEY ("ticket_type_id") REFERENCES "ticket_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_ticket_type_id_fkey" FOREIGN KEY ("ticket_type_id") REFERENCES "ticket_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_order_item_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "order_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_credentials" ADD CONSTRAINT "ticket_credentials_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_staff" ADD CONSTRAINT "event_staff_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_staff" ADD CONSTRAINT "event_staff_gate_id_fkey" FOREIGN KEY ("gate_id") REFERENCES "venue_gates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_staff" ADD CONSTRAINT "event_staff_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scan_sessions" ADD CONSTRAINT "scan_sessions_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scan_sessions" ADD CONSTRAINT "scan_sessions_gate_id_fkey" FOREIGN KEY ("gate_id") REFERENCES "venue_gates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scan_sessions" ADD CONSTRAINT "scan_sessions_scanner_id_fkey" FOREIGN KEY ("scanner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admissions" ADD CONSTRAINT "admissions_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admissions" ADD CONSTRAINT "admissions_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admissions" ADD CONSTRAINT "admissions_gate_id_fkey" FOREIGN KEY ("gate_id") REFERENCES "venue_gates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admissions" ADD CONSTRAINT "admissions_scanner_id_fkey" FOREIGN KEY ("scanner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scan_attempts" ADD CONSTRAINT "scan_attempts_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scan_attempts" ADD CONSTRAINT "scan_attempts_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scan_attempts" ADD CONSTRAINT "scan_attempts_gate_id_fkey" FOREIGN KEY ("gate_id") REFERENCES "venue_gates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scan_attempts" ADD CONSTRAINT "scan_attempts_scanner_id_fkey" FOREIGN KEY ("scanner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scan_attempts" ADD CONSTRAINT "scan_attempts_scan_session_id_fkey" FOREIGN KEY ("scan_session_id") REFERENCES "scan_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Database-enforced domain invariants not expressible in Prisma schema syntax.
ALTER TABLE "venues" ADD CONSTRAINT "venues_capacity_positive" CHECK ("capacity" > 0);
ALTER TABLE "events" ADD CONSTRAINT "events_time_range_valid" CHECK ("ends_at" > "starts_at");
ALTER TABLE "events" ADD CONSTRAINT "events_capacity_positive" CHECK ("capacity" > 0);
ALTER TABLE "ticket_types" ADD CONSTRAINT "ticket_types_price_nonnegative" CHECK ("price_minor" >= 0);
ALTER TABLE "ticket_types" ADD CONSTRAINT "ticket_types_user_limit_positive" CHECK ("per_user_limit" > 0);
ALTER TABLE "ticket_types" ADD CONSTRAINT "ticket_types_sale_window_valid" CHECK ("sales_end" > "sales_start");
ALTER TABLE "ticket_inventory" ADD CONSTRAINT "ticket_inventory_counts_valid" CHECK (
  "capacity" >= 0 AND "reserved" >= 0 AND "issued" >= 0 AND "reserved" + "issued" <= "capacity"
);
ALTER TABLE "orders" ADD CONSTRAINT "orders_money_nonnegative" CHECK (
  "subtotal_minor" >= 0 AND "fee_minor" >= 0 AND "tax_minor" >= 0 AND "total_minor" >= 0
);
ALTER TABLE "orders" ADD CONSTRAINT "orders_total_balances" CHECK (
  "total_minor" = "subtotal_minor" + "fee_minor" + "tax_minor"
);
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_values_valid" CHECK (
  "quantity" > 0 AND "unit_price_minor" >= 0 AND "fee_minor" >= 0 AND "tax_minor" >= 0
);
ALTER TABLE "ticket_credentials" ADD CONSTRAINT "ticket_credentials_version_positive" CHECK ("version" > 0);
ALTER TABLE "event_staff" ADD CONSTRAINT "event_staff_window_valid" CHECK ("valid_until" > "valid_from");
ALTER TABLE "outbox_events" ADD CONSTRAINT "outbox_attempts_nonnegative" CHECK ("attempts" >= 0);
