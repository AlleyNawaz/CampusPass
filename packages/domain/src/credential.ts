import { createHash, randomBytes } from "node:crypto";

export function createOpaqueCredential(): string {
  return randomBytes(32).toString("base64url");
}

export function hashCredential(credential: string): string {
  return createHash("sha256").update(credential, "utf8").digest("hex");
}
