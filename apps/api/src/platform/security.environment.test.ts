import { afterEach, describe, expect, it } from "vitest";
import {
  requestBodyLimit,
  validateApiEnvironment,
} from "./security.environment";

describe("API production environment", () => {
  const prior = { ...process.env };

  afterEach(() => {
    process.env = { ...prior };
  });

  it("rejects wildcard CORS and invalid body limits", () => {
    process.env.PUBLIC_WEB_ORIGINS = "*";
    expect(validateApiEnvironment).toThrow(/Wildcard/);
    process.env.PUBLIC_WEB_ORIGINS = "http://localhost:3000";
    process.env.API_BODY_LIMIT_BYTES = "9999999";
    expect(requestBodyLimit).toThrow(/between/);
  });

  it("fails closed when production database and proxy safeguards are absent", () => {
    process.env.NODE_ENV = "production";
    process.env.PUBLIC_WEB_ORIGINS = "https://campuspass.example";
    process.env.DATABASE_URL =
      "postgresql://runtime@example.invalid/campuspass?sslmode=verify-full";
    process.env.DATABASE_APP_ROLE = "campuspass_app";
    process.env.AUTH_MFA_ENCRYPTION_KEY_BASE64 = Buffer.alloc(32, 3).toString(
      "base64",
    );
    process.env.TICKET_CREDENTIAL_ENCRYPTION_KEY_BASE64 = Buffer.alloc(
      32,
      4,
    ).toString("base64");
    process.env.PAID_TICKETS_ENABLED = "false";
    process.env.OFFLINE_SCANNING_ENABLED = "false";
    process.env.TRUST_PROXY = "false";
    expect(validateApiEnvironment).toThrow(/TRUST_PROXY/);
    process.env.TRUST_PROXY = "true";
    expect(validateApiEnvironment).not.toThrow();
    process.env.PAID_TICKETS_ENABLED = "true";
    expect(validateApiEnvironment).toThrow(/Paid tickets/);
  });
});
