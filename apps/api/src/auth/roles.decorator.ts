import { SetMetadata } from "@nestjs/common";
import type { Role } from "@prisma/client";

export const REQUIRED_ROLES = "campuspass.required-roles";
export const Roles = (...roles: Role[]) => SetMetadata(REQUIRED_ROLES, roles);
