import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    await this.$connect();
    if (process.env.NODE_ENV === "production") {
      const expectedRole = process.env.DATABASE_APP_ROLE;
      const roles = await this.$queryRaw<
        Array<{
          current_user: string;
          rolsuper: boolean;
          rolbypassrls: boolean;
        }>
      >`SELECT current_user, rolsuper, rolbypassrls FROM pg_roles WHERE rolname = current_user`;
      const role = roles[0];
      if (
        !role ||
        role.current_user !== expectedRole ||
        role.rolsuper ||
        role.rolbypassrls
      ) {
        throw new Error(
          "Database connection must use the configured non-superuser, non-BYPASSRLS application role",
        );
      }
      const protectedTables = await this.$queryRaw<
        Array<{
          relname: string;
          relrowsecurity: boolean;
          relforcerowsecurity: boolean;
        }>
      >`SELECT relname, relrowsecurity, relforcerowsecurity
        FROM pg_class
        WHERE relname IN ('orders', 'tickets', 'events', 'societies')`;
      if (
        protectedTables.length !== 4 ||
        protectedTables.some(
          (table) => !table.relrowsecurity || !table.relforcerowsecurity,
        )
      ) {
        throw new Error("Required database row-level security is not enforced");
      }
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
