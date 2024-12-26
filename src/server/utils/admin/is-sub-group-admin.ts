import { PrismaTransactionClient } from "@/db";
import { SubGroupParams } from "@/lib/validations/params";

export async function isSubGroupAdmin(
  db: PrismaTransactionClient,
  params: SubGroupParams,
  userId: string,
) {
  const subGroupAdmin = await db.adminInSpace.findFirst({
    where: {
      allocationGroupId: params.group,
      allocationSubGroupId: params.subGroup,
      userId,
    },
    select: { adminLevel: true },
  });

  return !!subGroupAdmin;
}
