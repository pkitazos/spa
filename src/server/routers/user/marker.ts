import { markerTypeSchema, Stage } from "@/db/types";
import { projectDtoSchema, studentDtoSchema } from "@/dto";
import { gradedSubmissionDtoSchema } from "@/dto/marking";
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
          gradedSubmissions: z.array(gradedSubmissionDtoSchema),
        }),
      ),
    )
    .query(
      async ({ ctx: { user } }) => await user.getProjectsWithSubmissions(),
    ),

  updateMarks: procedure.instance
    .inStage([Stage.MARK_SUBMISSION])
    .marker.input(
      z.object({
        flagId: z.string(),
        submissionId: z.string(),
        studentId: z.string(),
        marks: z.array(
          z.object({
            assessmentComponentId: z.string(),
            mark: z.number(),
            justification: z.string(),
          }),
        ),
        finalComment: z.string(),
        recommendation: z.boolean(),
        draft: z.boolean(),
      }),
    )
    .mutation(
      async ({
        ctx: { instance, user, db },
        input: {
          flagId,
          submissionId,
          studentId,
          marks,
          finalComment,
          recommendation,
          draft,
        },
      }) => {
        const markerType = await user.getMarkerType(studentId);

        await db.$transaction([
          db.componentScore.deleteMany({
            where: { ...expand(instance.params), markerId: user.id, studentId },
          }),

          db.componentScore.createMany({
            data: marks.map((m) => ({
              ...expand(instance.params),
              markerId: user.id,
              studentId,
              grade: m.mark,
              justification: m.justification,
              draft,
              markerType,
              assessmentComponentId: m.assessmentComponentId,
            })),
            skipDuplicates: true,
          }),

          db.markerSubmissionComments.upsert({
            where: {
              studentMarkerSubmission: {
                studentId,
                markerId: user.id,
                submissionId,
              },
            },
            create: {
              ...expand(instance.params),
              studentId,
              markerId: user.id,
              submissionId,
              flagId,
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
});
