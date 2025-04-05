import { markerTypeSchema, Stage } from "@/db/types";
import {
  partialMarkDtoSchema,
  projectDtoSchema,
  studentDtoSchema,
  unitOfAssessmentGradeDtoSchema,
  unitOfAssessmentDtoSchema,
  assessmentCriterionDtoSchema,
} from "@/dto";
import { subsequentStages } from "@/lib/utils/permissions/stage-check";
import { procedure } from "@/server/middleware";
import { createTRPCRouter } from "@/server/trpc";
import { TRPCError } from "@trpc/server";
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
          unitsOfAssessment: z.array(
            z.object({
              unit: unitOfAssessmentDtoSchema,
              isSaved: z.boolean(),
              isSubmitted: z.boolean(),
            }),
          ),
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
    .query(
      async ({ ctx: { instance }, input: { unitOfAssessmentId } }) =>
        await instance.getCriteria(unitOfAssessmentId),
    ),

  getMarks: procedure.instance
    .inStage(subsequentStages(Stage.READER_BIDDING))
    .marker.input(
      z.object({ unitOfAssessmentId: z.string(), studentId: z.string() }),
    )
    .output(partialMarkDtoSchema)
    .query(
      async ({ ctx: { user }, input: { unitOfAssessmentId, studentId } }) =>
        await user.getMarksForStudentSubmission(unitOfAssessmentId, studentId),
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
        },
      }) => {
        const markerType = await user.getMarkerType(studentId);
        const { allowedMarkerTypes } =
          await instance.getUnitOfAssessment(unitOfAssessmentId);

        if (!allowedMarkerTypes.includes(markerType)) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "User is not correct marker type",
          });
        }

        await user.writeMarks({
          unitOfAssessmentId,
          studentId,
          marks,
          finalComment,
          recommendation,
          draft: false,
        });

        //TODO after submission logic
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
          marks = {},
          finalComment = "",
          recommendation = false,
        },
      }) => {
        const markerType = await user.getMarkerType(studentId);
        const { allowedMarkerTypes } =
          await instance.getUnitOfAssessment(unitOfAssessmentId);

        if (!allowedMarkerTypes.includes(markerType)) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "User is not correct marker type",
          });
        }

        await user.writeMarks({
          unitOfAssessmentId,
          studentId,
          marks,
          finalComment,
          recommendation,
          draft: true,
        });
      },
    ),
});
