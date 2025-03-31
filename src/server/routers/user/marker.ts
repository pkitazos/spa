import { markerTypeSchema, Stage } from "@/db/types";
import {
  assessmentCriterionWithScoreDtoSchema,
  partialMarkDtoSchema,
  projectDtoSchema,
  studentDtoSchema,
  unitOfAssessmentGradeDtoSchema,
  unitOfAssessmentDtoSchema,
  assessmentCriterionDtoSchema,
} from "@/dto";
import { expand } from "@/lib/utils/general/instance-params";
import { subsequentStages } from "@/lib/utils/permissions/stage-check";
import { procedure } from "@/server/middleware";
import { createTRPCRouter } from "@/server/trpc";
import { z } from "zod";

export const markerRouter = createTRPCRouter({
  getProjectsToMark: procedure.instance
    .inStage(subsequentStages(Stage.READER_BIDDING))
    .marker.output(
      z.array(
        z.object({
          project: projectDtoSchema,
          student: studentDtoSchema,
          markerType: markerTypeSchema,
          unitsOfAssessment: z.array(unitOfAssessmentDtoSchema),
        }),
      ),
    )
    .query(
      async ({ ctx: { user } }) => await user.getProjectsWithSubmissions(),
    ),

  getCriteria: procedure.instance
    .inStage(subsequentStages(Stage.READER_BIDDING))
    .marker.input(z.object({ unitOfAssessmentId: z.string() }))
    .output(z.array(assessmentCriterionDtoSchema))
    .query(async ({ ctx: { instance }, input: { unitOfAssessmentId } }) => {
      return await instance.getCriteria(unitOfAssessmentId);
    }),

  getMarks: procedure.instance
    .inStage(subsequentStages(Stage.READER_BIDDING))
    .marker.input(
      z.object({ unitOfAssessmentId: z.string(), studentId: z.string() }),
    )
    .output(unitOfAssessmentGradeDtoSchema)
    .query(
      async ({ ctx: { user }, input: { unitOfAssessmentId, studentId } }) => {
        return await user.getMarksForStudentSubmission(
          unitOfAssessmentId,
          studentId,
        );
      },
    ),

  getCriteriaAndScoresForStudentSubmission: procedure.instance
    .inStage(subsequentStages(Stage.READER_BIDDING))
    .marker.input(
      z.object({ unitOfAssessmentId: z.string(), studentId: z.string() }),
    )
    .output(z.array(assessmentCriterionWithScoreDtoSchema))
    .query(
      async ({
        ctx: { instance, user },
        input: { unitOfAssessmentId, studentId },
      }) =>
        await instance.getCriteriaAndScoresForStudentSubmission(
          unitOfAssessmentId,
          user.id,
          studentId,
        ),
    ),

  submitMarks: procedure.instance
    .inStage([Stage.MARK_SUBMISSION])
    .marker.input(unitOfAssessmentGradeDtoSchema)
    .mutation(
      async ({
        ctx: { instance, user, db },
        input: {
          unitOfAssessmentId,
          studentId,
          marks,
          finalComment,
          recommendation,
          draft,
        },
      }) => {
        const markerType = await user.getMarkerType(studentId);

        const { flag } = await instance.getUnitOfAssessment(unitOfAssessmentId);

        await db.$transaction([
          db.componentScore.deleteMany({
            where: { ...expand(instance.params), markerId: user.id, studentId },
          }),

          db.componentScore.createMany({
            data: Object.entries(marks).map(([assessmentCriterionId, m]) => ({
              ...expand(instance.params),
              markerId: user.id,
              studentId,
              grade: m.mark,
              justification: m.justification,
              draft: false,
              markerType,
              assessmentCriterionId,
            })),
            skipDuplicates: true,
          }),

          db.markerSubmissionComments.upsert({
            where: {
              studentMarkerSubmission: {
                studentId,
                markerId: user.id,
                unitOfAssessmentId,
              },
            },
            create: {
              ...expand(instance.params),
              studentId,
              markerId: user.id,
              unitOfAssessmentId,
              flagId: flag.id,
              summary: finalComment,
              recommendedForPrize: recommendation,
            },
            update: {
              summary: finalComment,
              recommendedForPrize: recommendation,
            },
          }),
        ]);
      },
    ),

  saveMarks: procedure.instance
    .inStage([Stage.MARK_SUBMISSION])
    .marker.input(partialMarkDtoSchema)
    .mutation(
      async ({
        ctx: { instance, user, db },
        input: {
          unitOfAssessmentId,
          studentId,
          marks,
          finalComment,
          recommendation,
          draft,
        },
      }) => {
        const markerType = await user.getMarkerType(studentId);

        const { flag } = await instance.getUnitOfAssessment(unitOfAssessmentId);

        console.log(recommendation);

        await db.$transaction([
          db.componentScore.deleteMany({
            where: {
              ...expand(instance.params),
              markerId: user.id,
              studentId,
              criterion: { unitOfAssessmentId },
            },
          }),

          db.componentScore.createMany({
            data: marks
              ? Object.entries(marks).map(([assessmentCriterionId, m]) => ({
                  ...expand(instance.params),
                  markerId: user.id,
                  studentId,
                  grade: m.mark,
                  justification: m.justification,
                  draft: draft ?? true,
                  markerType,
                  assessmentCriterionId,
                }))
              : [],
            skipDuplicates: true,
          }),

          db.markerSubmissionComments.upsert({
            where: {
              studentMarkerSubmission: {
                studentId,
                markerId: user.id,
                unitOfAssessmentId,
              },
            },
            create: {
              ...expand(instance.params),
              studentId,
              markerId: user.id,
              unitOfAssessmentId,
              flagId: flag.id,
              summary: finalComment ?? "",
              recommendedForPrize: recommendation,
            },
            update: {
              summary: finalComment,
              recommendedForPrize: recommendation,
            },
          }),
        ]);
      },
    ),

  getSummary: procedure.instance
    .inStage(subsequentStages(Stage.READER_BIDDING))
    .marker.input(
      z.object({
        params: z.object({
          group: z.string(),
          subGroup: z.string(),
          instance: z.string(),
        }),
        unitOfAssessmentId: z.string(),
        studentId: z.string(),
      }),
    )
    .output(z.tuple([z.string(), z.boolean()]))
    .query(
      async ({
        ctx: { user, db },
        input: { unitOfAssessmentId, studentId },
      }) => {
        const result = await db.markerSubmissionComments.findFirst({
          where: { studentId, markerId: user.id, unitOfAssessmentId },
        });

        console.log(
          result
            ? [result.summary ?? "", result.recommendedForPrize]
            : ["", false],
        );

        return result
          ? [result.summary ?? "", result.recommendedForPrize]
          : ["", false];
      },
    ),
});
