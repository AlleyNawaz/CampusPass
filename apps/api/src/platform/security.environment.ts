const MIN_BODY_LIMIT = 16 * 1024;
const MAX_BODY_LIMIT = 1024 * 1024;

export function approvedWebOrigins(): string[] {
  return (
    process.env.PUBLIC_WEB_ORIGINS ??
    process.env.PUBLIC_WEB_ORIGIN ??
    "http://localhost:3000"
  )
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

export function requestBodyLimit(): number {
  const value = Number(process.env.API_BODY_LIMIT_BYTES ?? 65_536);
  if (
    !Number.isInteger(value) ||
    value < MIN_BODY_LIMIT ||
    value > MAX_BODY_LIMIT
  ) {
    throw new Error(
      `API_BODY_LIMIT_BYTES must be between ${MIN_BODY_LIMIT} and ${MAX_BODY_LIMIT}`,
    );
  }
  return value;
}

export function validateApiEnvironment(): void {
  requestBodyLimit();
  const origins = approvedWebOrigins();
  if (origins.length === 0 || new Set(origins).size !== origins.length) {
    throw new Error("At least one unique web origin is required");
  }
  if (origins.some((origin) => origin === "*" || origin.endsWith("*"))) {
    throw new Error("Wildcard CORS origins are forbidden");
  }
  for (const origin of origins) {
    const url = new URL(origin);
    if (
      url.origin !== origin ||
      (url.protocol !== "http:" && url.protocol !== "https:")
    ) {
      throw new Error(`Invalid web origin: ${origin}`);
    }
    if (process.env.NODE_ENV === "production" && url.protocol !== "https:") {
      throw new Error("Production web origins must use HTTPS");
    }
  }
  if (
    process.env.NODE_ENV === "production" &&
    process.env.SWAGGER_ENABLED === "true"
  ) {
    throw new Error("Swagger cannot be enabled in production");
  }
  if (process.env.NODE_ENV === "production") {
    const ticketKey = process.env.TICKET_CREDENTIAL_ENCRYPTION_KEY_BASE64;
    const mfaKey = process.env.AUTH_MFA_ENCRYPTION_KEY_BASE64;
    if (!ticketKey || Buffer.from(ticketKey, "base64").length !== 32) {
      throw new Error(
        "TICKET_CREDENTIAL_ENCRYPTION_KEY_BASE64 must decode to exactly 32 bytes",
      );
    }
    if (ticketKey === mfaKey) {
      throw new Error("Ticket and MFA encryption keys must be distinct");
    }
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) throw new Error("DATABASE_URL is required");
    const parsedDatabaseUrl = new URL(databaseUrl);
    if (!parsedDatabaseUrl.protocol.startsWith("postgres")) {
      throw new Error("DATABASE_URL must use PostgreSQL");
    }
    const sslMode = parsedDatabaseUrl.searchParams.get("sslmode");
    if (!["require", "verify-ca", "verify-full"].includes(sslMode ?? "")) {
      throw new Error("Production DATABASE_URL must require TLS");
    }
    if (!process.env.DATABASE_APP_ROLE) {
      throw new Error("DATABASE_APP_ROLE is required in production");
    }
    if (process.env.TRUST_PROXY !== "true") {
      throw new Error(
        "TRUST_PROXY=true is required behind the production proxy",
      );
    }
    if (process.env.PAID_TICKETS_ENABLED !== "false") {
      throw new Error(
        "Paid tickets must remain disabled until provider approval",
      );
    }
    if (process.env.OFFLINE_SCANNING_ENABLED !== "false") {
      throw new Error("Offline scanning must remain disabled until approved");
    }
  }
}
