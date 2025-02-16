import { SubGroupParams } from "@/lib/validations/params";

import { TX } from "@/db/types";

/**
 * @deprecated
 * @param db
 * @param params
 * @param userId
 * @returns
 */
export async function isSubGroupAdmin(
  db: TX,
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
