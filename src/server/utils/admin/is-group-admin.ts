import { PrismaTransactionClient } from "@/db";
import { GroupParams } from "@/lib/validations/params";

export async function isGroupAdmin(
  db: PrismaTransactionClient,
  params: GroupParams,
  userId: string,
) {
  const groupAdmin = await db.adminInSpace.findFirst({
    where: {
      allocationGroupId: params.group,
      allocationSubGroupId: null,
      userId,
    },
  });

  return !!groupAdmin;
}
