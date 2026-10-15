import { UnauthorizedException } from "@nestjs/common";

export type ActorRole =
  | "STUDENT"
  | "ORGANIZER"
  | "GATE_STAFF"
  | "UNIVERSITY_ADMIN"
  | "PLATFORM_ADMIN";
export type DevActor = { userId: string; tenantId: string; role: ActorRole };

type HeaderValue = string | string[] | undefined;

function single(value: HeaderValue): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function readDevActor(headers: Record<string, HeaderValue>): DevActor {
  if (
    process.env.NODE_ENV === "production" ||
    process.env.DEV_AUTH_MODE !== "true"
  ) {
    throw new UnauthorizedException(
      "Production authentication is not implemented",
    );
  }
  const userId = single(headers["x-demo-user-id"]);
  const tenantId = single(headers["x-demo-tenant-id"]);
  const role = single(headers["x-demo-role"]) as ActorRole | undefined;
  if (!userId || !tenantId || !role)
    throw new UnauthorizedException(
      "Synthetic development actor headers are required",
    );
  return { userId, tenantId, role };
}
