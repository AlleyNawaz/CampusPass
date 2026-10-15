const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(value: string): string {
  return value.trim().toLocaleLowerCase("en-US");
}

export function isValidEmail(value: string): boolean {
  return emailPattern.test(normalizeEmail(value));
}

export function isAllowedCampusDomain(
  email: string,
  domains: readonly string[],
): boolean {
  const normalized = normalizeEmail(email);
  const domain = normalized.split("@")[1];
  return (
    domain !== undefined &&
    domains.some((allowed) => domain === allowed.toLowerCase())
  );
}
