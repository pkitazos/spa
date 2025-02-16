import { PrismaClient } from "@prisma/client";

import { InstanceParams } from "@/lib/validations/params";

/**
 * TODO delete
 * @deprecated
 * @param db
 * @param params
 * @returns
 */
export async function getInstance(db: PrismaClient, params: InstanceParams) {
  return await db.allocationInstance.findFirstOrThrow({
    where: {
      allocationGroupId: params.group,
      allocationSubGroupId: params.subGroup,
      id: params.instance,
    },
  });
}
