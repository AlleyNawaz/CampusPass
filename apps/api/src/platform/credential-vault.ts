import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const DEV_ONLY_KEY = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=";

export interface SealedCredential {
  ciphertext: string;
  iv: string;
  authTag: string;
}

function encryptionKey(): Buffer {
  const encoded = process.env.TICKET_CREDENTIAL_ENCRYPTION_KEY_BASE64;
  if (!encoded) {
    throw new Error("TICKET_CREDENTIAL_ENCRYPTION_KEY_BASE64 is required");
  }
  if (process.env.NODE_ENV === "production" && encoded === DEV_ONLY_KEY) {
    throw new Error(
      "The development credential key cannot be used in production",
    );
  }
  const key = Buffer.from(encoded, "base64");
  if (key.length !== 32) {
    throw new Error("Ticket credential encryption key must decode to 32 bytes");
  }
  return key;
}

export function sealCredential(credential: string): SealedCredential {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, encryptionKey(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(credential, "utf8"),
    cipher.final(),
  ]);
  return {
    ciphertext: ciphertext.toString("base64url"),
    iv: iv.toString("base64url"),
    authTag: cipher.getAuthTag().toString("base64url"),
  };
}

export function unsealCredential(value: SealedCredential): string {
  const decipher = createDecipheriv(
    ALGORITHM,
    encryptionKey(),
    Buffer.from(value.iv, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(value.authTag, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(value.ciphertext, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}
