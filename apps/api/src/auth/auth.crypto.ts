import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

export type SealedSecret = {
  ciphertext: string;
  iv: string;
  authTag: string;
};

export function createOpaqueToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashOpaqueToken(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

export function hashOptionalMetadata(value: string | undefined): string | null {
  return value ? hashOpaqueToken(value) : null;
}

export function constantTimeHashMatch(
  value: string,
  expectedHash: string,
): boolean {
  const actual = Buffer.from(hashOpaqueToken(value), "hex");
  const expected = Buffer.from(expectedHash, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function mfaEncryptionKey(): Buffer {
  const encoded = process.env.AUTH_MFA_ENCRYPTION_KEY_BASE64;
  if (!encoded) throw new Error("AUTH_MFA_ENCRYPTION_KEY_BASE64 is required");
  const key = Buffer.from(encoded, "base64");
  if (key.length !== 32) {
    throw new Error("MFA encryption key must decode to exactly 32 bytes");
  }
  return key;
}

export function sealMfaSecret(secret: string, userId: string): SealedSecret {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", mfaEncryptionKey(), iv);
  cipher.setAAD(Buffer.from(`campuspass:mfa:${userId}`, "utf8"));
  const ciphertext = Buffer.concat([
    cipher.update(secret, "utf8"),
    cipher.final(),
  ]);
  return {
    ciphertext: ciphertext.toString("base64url"),
    iv: iv.toString("base64url"),
    authTag: cipher.getAuthTag().toString("base64url"),
  };
}

export function unsealMfaSecret(value: SealedSecret, userId: string): string {
  const decipher = createDecipheriv(
    "aes-256-gcm",
    mfaEncryptionKey(),
    Buffer.from(value.iv, "base64url"),
  );
  decipher.setAAD(Buffer.from(`campuspass:mfa:${userId}`, "utf8"));
  decipher.setAuthTag(Buffer.from(value.authTag, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(value.ciphertext, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}
