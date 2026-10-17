import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  createOpaqueToken,
  hashOpaqueToken,
  sealMfaSecret,
  unsealMfaSecret,
} from "./auth.crypto";

describe("authentication cryptography", () => {
  const previousKey = process.env.AUTH_MFA_ENCRYPTION_KEY_BASE64;

  beforeEach(() => {
    process.env.AUTH_MFA_ENCRYPTION_KEY_BASE64 = Buffer.alloc(32, 9).toString(
      "base64",
    );
  });

  afterEach(() => {
    process.env.AUTH_MFA_ENCRYPTION_KEY_BASE64 = previousKey;
  });

  it("creates high-entropy opaque tokens and stable non-plaintext hashes", () => {
    const first = createOpaqueToken();
    const second = createOpaqueToken();
    expect(first).toHaveLength(43);
    expect(second).not.toBe(first);
    expect(hashOpaqueToken(first)).toHaveLength(64);
    expect(hashOpaqueToken(first)).not.toContain(first);
  });

  it("encrypts MFA secrets with user-bound authenticated encryption", () => {
    const sealed = sealMfaSecret("BASE32MFASECRET", "user-a");
    expect(JSON.stringify(sealed)).not.toContain("BASE32MFASECRET");
    expect(unsealMfaSecret(sealed, "user-a")).toBe("BASE32MFASECRET");
    expect(() => unsealMfaSecret(sealed, "user-b")).toThrow();
    const tampered = `${sealed.ciphertext[0] === "A" ? "B" : "A"}${sealed.ciphertext.slice(1)}`;
    expect(() =>
      unsealMfaSecret({ ...sealed, ciphertext: tampered }, "user-a"),
    ).toThrow();
  });
});
