import { generate } from "otplib";
import { describe, expect, it } from "vitest";
import { createMfaEnrollment, verifyMfaCode } from "./mfa";

describe("TOTP MFA", () => {
  it("creates authenticator-compatible enrollment and rejects code replay", async () => {
    const enrollment = createMfaEnrollment("admin@example.invalid");
    expect(enrollment.secret.length).toBeGreaterThanOrEqual(32);
    expect(enrollment.otpauthUri).toMatch(
      /^otpauth:\/\/totp\/CampusPass:admin%40example\.invalid\?/,
    );
    const code = await generate({ secret: enrollment.secret });
    const timeStep = await verifyMfaCode(enrollment.secret, code);
    expect(timeStep).toBeTypeOf("number");
    await expect(
      verifyMfaCode(enrollment.secret, code, timeStep!),
    ).resolves.toBeNull();
  });

  it("rejects malformed or incorrect codes", async () => {
    const enrollment = createMfaEnrollment("admin@example.invalid");
    const current = await generate({ secret: enrollment.secret });
    const incorrect = current === "000000" ? "000001" : "000000";
    await expect(
      verifyMfaCode(enrollment.secret, incorrect),
    ).resolves.toBeNull();
  });
});
