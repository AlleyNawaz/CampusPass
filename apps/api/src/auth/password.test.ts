import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./password";

describe("password hashing", () => {
  const priorEnv = { ...process.env };

  beforeEach(() => {
    process.env.NODE_ENV = "test";
    process.env.AUTH_PASSWORD_PEPPER =
      "test-pepper-that-is-at-least-32-characters";
  });

  afterEach(() => {
    process.env = { ...priorEnv };
  });

  it("uses Argon2id with the configured memory and work factors", async () => {
    const encoded = await hashPassword("a-long-unique-password");
    expect(encoded).toMatch(/^\$argon2id\$v=19\$m=19456,p=1,t=2\$/);
    expect(encoded).not.toContain("a-long-unique-password");
    await expect(
      verifyPassword(encoded, "a-long-unique-password"),
    ).resolves.toBe(true);
    await expect(verifyPassword(encoded, "wrong-password")).resolves.toBe(
      false,
    );
  });

  it("fails closed when the production pepper is missing", async () => {
    process.env.NODE_ENV = "production";
    delete process.env.AUTH_PASSWORD_PEPPER;
    await expect(hashPassword("a-long-unique-password")).rejects.toThrow(
      /AUTH_PASSWORD_PEPPER/,
    );
  });
});
