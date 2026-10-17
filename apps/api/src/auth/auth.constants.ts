export const SESSION_ABSOLUTE_TTL_MS = 12 * 60 * 60 * 1000;
export const SESSION_IDLE_TTL_MS = 30 * 60 * 1000;
export const AUTH_CHALLENGE_TTL_MS = 10 * 60 * 1000;
export const MAX_AUTH_ATTEMPTS = 5;
export const ACCOUNT_LOCK_MS = 15 * 60 * 1000;

export const PRIVILEGED_ROLES = new Set([
  "SOCIETY_ADMIN",
  "FINANCE_MANAGER",
  "UNIVERSITY_ADMIN",
  "PLATFORM_ADMIN",
  "SUPPORT",
]);

export function sessionCookieName(): string {
  return process.env.NODE_ENV === "production"
    ? "__Host-campuspass_session"
    : "campuspass_session";
}

export function csrfCookieName(): string {
  return process.env.NODE_ENV === "production"
    ? "__Host-campuspass_csrf"
    : "campuspass_csrf";
}

export function challengeCookieName(): string {
  return process.env.NODE_ENV === "production"
    ? "__Host-campuspass_pre_auth"
    : "campuspass_pre_auth";
}
