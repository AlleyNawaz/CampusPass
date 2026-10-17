export function validateAuthenticationEnvironment(): void {
  if (process.env.DEV_AUTH_MODE !== undefined) {
    throw new Error("DEV_AUTH_MODE has been removed; use real authentication");
  }
  if (process.env.NODE_ENV !== "production") return;

  const pepper = process.env.AUTH_PASSWORD_PEPPER;
  if (!pepper || pepper.length < 32) {
    throw new Error("AUTH_PASSWORD_PEPPER must be at least 32 characters");
  }
  const encodedMfaKey = process.env.AUTH_MFA_ENCRYPTION_KEY_BASE64;
  if (!encodedMfaKey || Buffer.from(encodedMfaKey, "base64").length !== 32) {
    throw new Error(
      "AUTH_MFA_ENCRYPTION_KEY_BASE64 must decode to exactly 32 bytes",
    );
  }
  const origins =
    process.env.PUBLIC_WEB_ORIGINS ?? process.env.PUBLIC_WEB_ORIGIN;
  if (
    !origins ||
    origins.split(",").some((origin) => !origin.trim().startsWith("https://"))
  ) {
    throw new Error("Production web origins must be explicit HTTPS origins");
  }
}
