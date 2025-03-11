import { PrismaClient } from "@prisma/client";

import { expand } from "@/lib/utils/general/instance-params";
import { InstanceParams } from "@/lib/validations/params";

import draftPreferences from "./data/Preference.json";
import savedPreferences from "./data/SavedPreference.json";
import { preferenceTypeSchema } from "../types";

export async function student_preferences(
  db: PrismaClient,
  params: InstanceParams,
) {
  // TODO: sort + normalise
  const draftPreferenceData = draftPreferences
    .filter(
      (x) =>
        x.allocation_group_id === params.group &&
        x.allocation_sub_group_id === params.subGroup &&
        x.allocation_instance_id === params.instance,
    )
    .map((x) => ({
      projectId: x.project_id,
      userId: x.user_id,
      score: x.rank,
      type: preferenceTypeSchema.parse(x.type),
      ...expand(params),
    }));

  const savedPreferenceData = savedPreferences
    .filter(
      (x) =>
        x.allocation_group_id === params.group &&
        x.allocation_sub_group_id === params.subGroup &&
        x.allocation_instance_id === params.instance,
    )
    .map((x) => ({
      projectId: x.project_id,
      userId: x.user_id,
      rank: x.rank,
      ...expand(params),
    }));

  await db.$transaction([
    db.studentDraftPreference.createMany({
      data: draftPreferenceData,
      skipDuplicates: true,
    }),

    db.studentSubmittedPreference.createMany({
      data: savedPreferenceData,
      skipDuplicates: true,
    }),
  ]);
}
