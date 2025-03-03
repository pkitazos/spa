import { InstanceParams } from "@/lib/validations/params";

import { TX } from "@/db/types";
import { expand } from "@/lib/utils/general/instance-params";

// move
export async function linkProjectFlags(
  db: TX,
  params: InstanceParams,
  projectId: string,
  flagTitles: string[],
) {
  const existingFlags = await db.flag.findMany({
    where: { ...expand(params), title: { in: flagTitles } },
    select: { id: true, title: true },
  });

  await db.flagOnProject.createMany({
    data: existingFlags.map(({ id }) => ({ projectId, flagId: id })),
    skipDuplicates: true,
  });
}
