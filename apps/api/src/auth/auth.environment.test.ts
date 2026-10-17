import { afterEach, describe, expect, it } from "vitest";
import { validateAuthenticationEnvironment } from "./auth.environment";

describe("authentication environment", () => {
  const prior = { ...process.env };

  afterEach(() => {
    process.env = { ...prior };
  });

  it("refuses the legacy development authentication switch in every environment", () => {
    process.env.NODE_ENV = "development";
    process.env.DEV_AUTH_MODE = "false";
    expect(validateAuthenticationEnvironment).toThrow(/removed/);
  });

  it("requires production secrets and HTTPS origins", () => {
    process.env.NODE_ENV = "production";
    delete process.env.DEV_AUTH_MODE;
    delete process.env.AUTH_PASSWORD_PEPPER;
    delete process.env.AUTH_MFA_ENCRYPTION_KEY_BASE64;
    process.env.PUBLIC_WEB_ORIGIN = "http://example.invalid";
    expect(validateAuthenticationEnvironment).toThrow(/AUTH_PASSWORD_PEPPER/);

    process.env.AUTH_PASSWORD_PEPPER = "p".repeat(32);
    process.env.AUTH_MFA_ENCRYPTION_KEY_BASE64 = Buffer.alloc(32, 4).toString(
      "base64",
    );
    expect(validateAuthenticationEnvironment).toThrow(/HTTPS/);

    process.env.PUBLIC_WEB_ORIGIN = "https://campuspass.example";
    expect(validateAuthenticationEnvironment).not.toThrow();
  });
});
