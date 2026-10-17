import argon2 from "argon2";

const ARGON2_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
  hashLength: 32,
} as const;

function passwordMaterial(password: string): string {
  const pepper = process.env.AUTH_PASSWORD_PEPPER;
  if (
    process.env.NODE_ENV === "production" &&
    (!pepper || pepper.length < 32)
  ) {
    throw new Error("AUTH_PASSWORD_PEPPER must be at least 32 characters");
  }
  return `${password}\u0000${pepper ?? "development-no-pepper"}`;
}

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(passwordMaterial(password), ARGON2_OPTIONS);
}

export async function verifyPassword(
  encodedHash: string,
  password: string,
): Promise<boolean> {
  try {
    return await argon2.verify(encodedHash, passwordMaterial(password));
  } catch {
    return false;
  }
}
