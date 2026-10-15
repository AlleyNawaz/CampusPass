import { describe, expect, it } from "vitest";
import { createOpaqueCredential, hashCredential } from "./credential.js";

describe("ticket credentials", () => {
  it("creates at least 256 bits of opaque entropy and stores only a hash", () => {
    const credential = createOpaqueCredential();
    expect(Buffer.from(credential, "base64url")).toHaveLength(32);
    expect(hashCredential(credential)).toMatch(/^[a-f0-9]{64}$/);
    expect(hashCredential(credential)).not.toContain(credential);
  });

  it("does not embed personal data", () => {
    const credential = createOpaqueCredential();
    expect(credential).not.toContain("@");
    expect(credential).not.toContain("student");
  });
});
