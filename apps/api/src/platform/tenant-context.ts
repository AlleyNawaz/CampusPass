import { Prisma } from "@prisma/client";

export async function setTenantContext(
  tx: Prisma.TransactionClient,
  tenantId: string,
  userId: string,
): Promise<void> {
  await tx.$queryRaw(Prisma.sql`
    SELECT
      set_config('app.current_tenant_id', ${tenantId}, true),
      set_config('app.current_user_id', ${userId}, true)
  `);
}
