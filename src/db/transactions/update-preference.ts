import { type DB, type PreferenceType } from "@/db/types";

import { expand } from "@/lib/utils/general/instance-params";
import { type InstanceParams } from "@/lib/validations/params";

export async function updatePreferenceTransaction(
  db: DB,
  {
    params,
    userId,
    projectId,
    preferenceType,
  }: {
    params: InstanceParams;
    userId: string;
    projectId: string;
    preferenceType: PreferenceType | undefined;
  },
) {
  await db.$transaction(async (tx) => {
    const projectFlags = await tx.project
      .findFirstOrThrow({
        where: { id: projectId },
        select: { flagsOnProject: { select: { flag: true } } },
      })
      .then((data) => data.flagsOnProject.map((f) => f.flag.displayName))
      .then((x) => new Set(x));

    const { studentFlag } = await tx.studentDetails.findFirstOrThrow({
      where: { userId, ...expand(params) },
      select: { studentFlag: true },
    });

    if (projectFlags.has(studentFlag.displayName)) {
      throw new Error(`This project is not suitable for this student`);
    }

    if (!preferenceType) {
      await tx.studentDraftPreference.delete({
        where: { draftPreferenceId: { userId, projectId, ...expand(params) } },
      });

      return;
    }

    const preferences = await tx.studentDraftPreference.aggregate({
      where: { userId, type: preferenceType, ...expand(params) },
      _max: { score: true },
    });

    const nextScore = (preferences._max?.score ?? 0) + 1;

    await tx.studentDraftPreference.upsert({
      where: { draftPreferenceId: { projectId, userId, ...expand(params) } },
      create: {
        ...expand(params),
        projectId,
        userId,
        type: preferenceType,
        score: nextScore,
      },
      update: { type: preferenceType, score: nextScore },
    });
  });
}
