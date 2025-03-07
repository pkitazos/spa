import { ProjectParams } from "@/lib/validations/params";

import { TX } from "@/db/types";
import { expand } from "@/lib/utils/general/instance-params";

// move
export async function linkProjectFlags(
  db: TX,
  params: ProjectParams,

  flagTitles: string[],
) {
  await db.flagOnProject.deleteMany({
    where: {
      projectId: params.projectId,
      flag: { title: { notIn: flagTitles } },
    },
  });

  const existingFlags = await db.flag.findMany({
    where: { ...expand(params), title: { in: flagTitles } },
    select: { id: true, title: true },
  });

  await db.flagOnProject.createMany({
    data: existingFlags.map(({ id }) => ({
      projectId: params.projectId,
      flagId: id,
    })),
    skipDuplicates: true,
  });
}

export async function linkProjectTags(
  db: TX,
  params: ProjectParams,
  tagTitles: string[],
) {
  const tags = await db.tag.createManyAndReturn({
    data: tagTitles.map((tag) => ({ ...expand(params), title: tag })),
    skipDuplicates: true,
  });

  await db.tagOnProject.deleteMany({ where: { projectId: params.projectId } });

  await db.tagOnProject.createMany({
    data: tags.map(({ id }) => ({ projectId: params.projectId, tagId: id })),
    skipDuplicates: true,
  });
}

export async function linkPreallocatedStudent(
  tx: TX,
  params: ProjectParams,
  userId: string,
) {
  await tx.studentProjectAllocation.deleteMany({
    where: { ...expand(params), projectId: params.projectId },
  });

  await tx.studentProjectAllocation.create({
    data: {
      ...expand(params),
      projectId: params.projectId,
      userId,
      studentRanking: 1,
    },
  });
}
