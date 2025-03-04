// TODO move to dal
import { expand } from "@/lib/utils/general/instance-params";
import { relativeComplement } from "@/lib/utils/general/set-difference";
import { InstanceParams } from "@/lib/validations/params";

import { DB, PreferenceType } from "@/db/types";

export async function updateManyPreferenceTransaction(
  db: DB,
  {
    params,
    userId,
    projectIds,
    preferenceType,
  }: {
    params: InstanceParams;
    userId: string;
    projectIds: string[];
    preferenceType: PreferenceType | undefined;
  },
) {
  await db.$transaction(async (tx) => {
    const projectFlags = await tx.project
      .findFirstOrThrow({
        where: { id: { in: projectIds } },
        select: { flagsOnProject: { select: { flag: true } } },
      })
      .then((data) => data.flagsOnProject.map((f) => f.flag.title))
      .then((x) => new Set(x));

    const studentFlags = await tx.studentDetails
      .findFirstOrThrow({
        where: { userId, ...expand(params) },
        select: { studentFlags: { select: { flag: true } } },
      })
      .then((data) => data.studentFlags.map((f) => f.flag.title))
      .then((x) => new Set(x));

    if (projectFlags.intersection(studentFlags).size <= 0) {
      throw new Error(
        `One or more of the selected projects are not suitable for this student`,
      );
    }

    if (!preferenceType) {
      await tx.studentDraftPreference.deleteMany({
        where: { userId, projectId: { in: projectIds }, ...expand(params) },
      });
      return;
    }

    if (preferenceType === PreferenceType.SHORTLIST) {
      const alreadyInLists = await tx.studentDraftPreference.findMany({
        where: { userId, projectId: { in: projectIds }, ...expand(params) },
        select: { projectId: true },
      });

      const newAdditions = relativeComplement(
        projectIds,
        alreadyInLists,
        (a, b) => a === b.projectId,
      );

      await tx.studentDraftPreference.createMany({
        data: newAdditions.map((id) => ({
          projectId: id,
          type: preferenceType,
          score: 1,
          userId,
          ...expand(params),
        })),
      });

      await tx.studentDraftPreference.updateMany({
        where: {
          userId,
          projectId: { in: alreadyInLists.map((p) => p.projectId) },
          ...expand(params),
        },
        data: { type: preferenceType },
      });
    }

    const preferences = await tx.studentDraftPreference.aggregate({
      where: { userId, type: preferenceType, ...expand(params) },
      _max: { score: true },
    });

    let nextScore = (preferences._max?.score ?? 0) + 1;

    for (const projectId of projectIds) {
      await tx.studentDraftPreference.upsert({
        where: { draftPreferenceId: { projectId, userId, ...expand(params) } },
        create: {
          projectId,
          userId,
          type: preferenceType,
          score: nextScore,
          ...expand(params),
        },
        update: { type: preferenceType, score: nextScore },
      });
      nextScore++;
    }
  });
}
