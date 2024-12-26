import { PrismaTransactionClient } from "@/db";
import { GroupParams, SubGroupParams } from "@/lib/validations/params";

export async function getGroupDisplayNames(db: PrismaTransactionClient) {
  const displayNameData = await db.allocationGroup.findMany({
    select: {
      id: true,
      displayName: true,
    },
  });

  const record = displayNameData.reduce(
    (acc, group) => ({
      ...acc,
      [group.id]: group.displayName,
    }),
    {} as Record<string, string>,
  );

  return (params: GroupParams) => record[params.group];
}

export async function getSubGroupDisplayNames(db: PrismaTransactionClient) {
  const displayNameData = await db.allocationSubGroup.findMany({
    select: {
      id: true,
      displayName: true,
      allocationGroup: {
        select: {
          id: true,
        },
      },
    },
  });

  const record = displayNameData.reduce(
    (acc, subGroup) => ({
      ...acc,
      [subGroup.allocationGroup.id + subGroup.id]: subGroup.displayName,
    }),
    {} as Record<string, string>,
  );

  return (params: SubGroupParams) => record[params.group + params.subGroup];
}
