import { InstanceParams } from "@/lib/validations/params";

import { TX } from "@/db/types";

export async function linkProjectFlags(
  db: TX,
  params: InstanceParams,
  projectId: string,
  flagTitles: string[],
) {
  const existingFlags = await db.flag.findMany({
    where: {
      allocationGroupId: params.group,
      allocationSubGroupId: params.subGroup,
      allocationInstanceId: params.instance,
      title: { in: flagTitles },
    },
    select: { id: true, title: true },
  });

  await db.flagOnProject.createMany({
    data: existingFlags.map(({ id }) => ({
      projectId,
      flagId: id,
    })),
    skipDuplicates: true,
  });
}
