import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { sealCredential, unsealCredential } from "./credential-vault";

describe("credential vault", () => {
  const previous = process.env.TICKET_CREDENTIAL_ENCRYPTION_KEY_BASE64;

  beforeEach(() => {
    process.env.TICKET_CREDENTIAL_ENCRYPTION_KEY_BASE64 = Buffer.alloc(
      32,
      7,
    ).toString("base64");
  });

  afterEach(() => {
    process.env.TICKET_CREDENTIAL_ENCRYPTION_KEY_BASE64 = previous;
  });

  it("round-trips without exposing plaintext in stored fields", () => {
    const raw = "cp_live_opaque_bearer";
    const sealed = sealCredential(raw);
    expect(JSON.stringify(sealed)).not.toContain(raw);
    expect(unsealCredential(sealed)).toBe(raw);
  });

  it("rejects an incorrectly sized key", () => {
    process.env.TICKET_CREDENTIAL_ENCRYPTION_KEY_BASE64 = "dG9vLXNob3J0";
    expect(() => sealCredential("secret")).toThrow(/32 bytes/);
  });
});
