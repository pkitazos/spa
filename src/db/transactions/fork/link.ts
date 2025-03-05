import { TX } from "@/db/types";

import { MappingData } from "./copy";
import { ForkMarkedProjectDto } from "./mark";

export async function link(
  tx: TX,
  parentInstanceProjects: ForkMarkedProjectDto[],
  mappings: MappingData,
) {
  await linkTags(tx, parentInstanceProjects, mappings);
  await linkFlags(tx, parentInstanceProjects, mappings);
}

export async function linkTags(
  tx: TX,
  parentInstanceProjects: ForkMarkedProjectDto[],
  { tag, project }: MappingData,
) {
  await tx.tagOnProject.createMany({
    data: parentInstanceProjects.flatMap((p) =>
      p.tagsOnProject.map((t) => ({
        x: p.title,
        oldId: t.tagId,
        tagId: tag[t.tagId],
        projectId: project[p.id],
      })),
    ),
  });
}

export async function linkFlags(
  tx: TX,
  parentInstanceProjects: ForkMarkedProjectDto[],
  { flag, project }: MappingData,
) {
  await tx.flagOnProject.createMany({
    data: parentInstanceProjects.flatMap((p) =>
      p.flagsOnProject.map((f) => ({
        flagId: flag[f.flagId],
        projectId: project[p.id],
      })),
    ),
  });
}
