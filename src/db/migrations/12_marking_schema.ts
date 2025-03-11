import { InstanceParams } from "@/lib/validations/params";
import { DB } from "../types";
import flags from "./data/L5-correct.t.json";
import { expand } from "@/lib/utils/general/instance-params";

export async function marking_scheme(db: DB, params: InstanceParams) {
  await db.$transaction(async (tx) => {
    const flagData = await tx.flag.createManyAndReturn({
      data: flags.map((f) => ({
        ...expand(params),
        title: f.flag,
        description: f.description,
      })),
      skipDuplicates: true,
    });

    const flagTitleToId = flagData.reduce(
      (acc, val) => ({ ...acc, [val.title]: val.id }),
      {} as Record<string, string>,
    );

    const units = await tx.unitOfAssessment.createManyAndReturn({
      data: flags.flatMap((f) =>
        f.units_of_assessment.map((a) => ({
          ...expand(params),
          flagId: flagTitleToId[f.flag],
          title: a.title,
          weight: a.weight,
          studentSubmissionDeadline: a.student_submission_deadline,
          markerSubmissionDeadline: a.marker_submission_deadline,
        })),
      ),
    });

    const unitTitleToId = units.reduce(
      (acc, val) => ({ ...acc, [`${val.flagId}${val.title}`]: val.id }),
      {} as Record<string, string>,
    );

    await tx.assessmentCriterion.createMany({
      data: flags.flatMap((f) =>
        f.units_of_assessment.flatMap((u) =>
          u.allowed_marker_types.flatMap((m) =>
            u.assessment_criteria.map((c, i) => ({
              ...expand(params),
              flagId: flagTitleToId[f.flag],
              unitOfAssessmentId:
                unitTitleToId[`${flagTitleToId[f.flag]}${u.title}`],
              title: c.title,
              description: c.description,
              weight: c.weight,
              layoutIndex: i + 1,
              markerType: m === "supervisor" ? "SUPERVISOR" : "READER",
            })),
          ),
        ),
      ),
    });
  });
}
