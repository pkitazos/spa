import { AdminLevel } from "@prisma/client";

import { PrismaTransactionClient } from "@/db";

export async function isSuperAdmin(
  db: PrismaTransactionClient,
  userId: string,
) {
  const superAdmin = await db.adminInSpace.findFirst({
    where: { userId, adminLevel: AdminLevel.SUPER },
    select: { adminLevel: true },
  });
  return !!superAdmin;
}
