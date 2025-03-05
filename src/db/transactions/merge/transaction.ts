import { PrismaClient } from "@prisma/client";

import { InstanceParams } from "@/lib/validations/params";

import { copy } from "./copy";
import { mark } from "./mark";

export async function mergeInstanceTrx(
  db: PrismaClient,
  params: InstanceParams,
) {
  await db.$transaction(async (tx) => {
    const forkedInstance = await tx.allocationInstance.findFirstOrThrow({
      where: {
        allocationGroupId: params.group,
        allocationSubGroupId: params.subGroup,
        id: params.instance,
      },
    });

    const markedData = await mark(tx, params);

    await copy(tx, forkedInstance.parentInstanceId!, params, markedData);
  });
}
