import { PrismaTransactionClient } from "@/db";

import { MappingData } from "./copy";
import { ForkMarkedProjectDto } from "./mark";

export async function link(
  tx: PrismaTransactionClient,
  parentInstanceProjects: ForkMarkedProjectDto[],
  mappings: MappingData,
) {
  await linkTags(tx, parentInstanceProjects, mappings);
  await linkFlags(tx, parentInstanceProjects, mappings);
}

export async function linkTags(
  tx: PrismaTransactionClient,
  parentInstanceProjects: ForkMarkedProjectDto[],
  { tag, project }: MappingData,
) {
  await tx.tagOnProject.createMany({
    data: parentInstanceProjects.flatMap((p) =>
      p.tagOnProject.map((t) => ({
        x: p.title,
        oldId: t.tagId,
        tagId: tag[t.tagId],
        projectId: project[p.id],
      })),
    ),
  });
}

export async function linkFlags(
  tx: PrismaTransactionClient,
  parentInstanceProjects: ForkMarkedProjectDto[],
  { flag, project }: MappingData,
) {
  await tx.flagOnProject.createMany({
    data: parentInstanceProjects.flatMap((p) =>
      p.flagOnProjects.map((f) => ({
        flagId: flag[f.flagId],
        projectId: project[p.id],
      })),
    ),
  });
}
