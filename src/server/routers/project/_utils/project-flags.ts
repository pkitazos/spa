import { PrismaTransactionClient } from "@/db";
import { InstanceParams } from "@/lib/validations/params";

export async function createProjectFlags(
  db: PrismaTransactionClient,
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
