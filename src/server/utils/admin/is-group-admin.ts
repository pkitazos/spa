import { GroupParams } from "@/lib/validations/params";

import { TX } from "@/db/types";

export async function isGroupAdmin(
  db: TX,
  params: GroupParams,
  userId: string,
) {
  const groupAdmin = await db.groupAdmin.findFirst({
    where: { allocationGroupId: params.group, userId },
  });

  return !!groupAdmin;
}
