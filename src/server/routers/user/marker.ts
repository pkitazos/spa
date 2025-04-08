import { Grade } from "@/config/grades";
import { Marker, Student } from "@/data-objects";
import { Transformers as T } from "@/db/transformers";
import { markerTypeSchema, Stage } from "@/db/types";
import {
  partialMarkingSubmissionDtoSchema,
  projectDtoSchema,
  studentDtoSchema,
  markingSubmissionDtoSchema,
  unitOfAssessmentDtoSchema,
  assessmentCriterionDtoSchema,
  ReaderDTO,
} from "@/dto";
import { markingSubmissionStatusSchema } from "@/dto/result/marking-submission-status";
import { subsequentStages } from "@/lib/utils/permissions/stage-check";
import { procedure } from "@/server/middleware";
import { createTRPCRouter } from "@/server/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

export const markerRouter = createTRPCRouter({
  getUnitById: procedure.instance
    .inStage(subsequentStages(Stage.READER_BIDDING))
    .marker.input(z.object({ unitOfAssessmentId: z.string() }))
    .output(unitOfAssessmentDtoSchema)
    .query(async ({ ctx: { db }, input: { unitOfAssessmentId } }) => {
      const res = await db.unitOfAssessment.findFirstOrThrow({
        where: { id: unitOfAssessmentId },
        include: { flag: true, assessmentCriteria: true },
      });

      return T.toUnitOfAssessmentDTO(res);
    }),

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
              status: markingSubmissionStatusSchema,
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

  getSubmission: procedure.instance
    .inStage(subsequentStages(Stage.READER_BIDDING))
    .marker.input(
      z.object({ unitOfAssessmentId: z.string(), studentId: z.string() }),
    )
    .output(
      z.object({
        submission: markingSubmissionDtoSchema,
        status: markingSubmissionStatusSchema,
      }),
    )
    .query(
      async ({
        ctx: { user, instance },
        input: { unitOfAssessmentId, studentId },
      }) => {
        const unit = await instance.getUnitOfAssessment(unitOfAssessmentId);

        const submission = await user.getMarkingSubmission(
          unitOfAssessmentId,
          studentId,
        );

        const status = Marker.computeStatus(unit, submission);

        return { submission, status };
      },
    ),

  submitMarks: procedure.instance
    .inStage([Stage.MARK_SUBMISSION])
    .marker.input(markingSubmissionDtoSchema)
    .mutation(
      async ({
        ctx: { instance, user, db, mailer },
        input: {
          params,
          unitOfAssessmentId,
          studentId,
          marks,
          finalComment,
          recommendation,
        },
      }) => {
        const markerType = await user.getMarkerType(studentId);
        const { allowedMarkerTypes, components } =
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

        if (allowedMarkerTypes.length === 1) {
          const grade = Grade.computeFromScores(
            components.map((c) => ({
              weight: c.weight,
              score: marks[c.id].mark,
            })),
          );

          await user.writeFinalMark({
            studentId,
            grade,
            unitOfAssessmentId,
            comment: "Auto-resolved",
          });

          return;
        }

        const numSubmissions = await db.markingSubmission.count({
          where: { studentId, unitOfAssessmentId },
        });

        // if this is a doubly-marked submission, but only 1 has been submitted, do nothing.
        if (numSubmissions < allowedMarkerTypes.length) {
          return;
        } else if (numSubmissions > allowedMarkerTypes.length) {
          console.error("more submissions than marker types!!?!?!");
          return;
        }

        // otherwise, if this is a doubly-marked submission, and now both are submitted then:
        const data = await db.markingSubmission.findMany({
          where: { studentId, unitOfAssessmentId },
          include: { criterionScores: true },
        });

        const gradesByMarker = data.reduce(
          (acc, val) => {
            const scoreMap = val.criterionScores.reduce(
              (acc, val) => ({
                ...acc,
                [val.assessmentCriterionId]: val.grade,
              }),
              {} as Record<string, number>,
            );

            return {
              ...acc,
              [val.markerId]: Grade.computeFromScores(
                components.map((c) => ({
                  weight: c.weight,
                  score: scoreMap[c.id],
                })),
              ),
            };
          },
          {} as Record<string, number>,
        );

        const studentDO = new Student(db, studentId, params);

        const student = await studentDO.get();
        const { supervisor, project } = await studentDO.getAllocation();

        const reader: ReaderDTO = await studentDO.getReader();

        // run the auto-resolve function on the grades.
        const resolution = Grade.autoResolve(
          Grade.toLetter(gradesByMarker[supervisor.id]),
          Grade.toLetter(gradesByMarker[reader.id]),
        );

        if (resolution.status === "INSUFFICIENT") {
          console.error("unreachable: auto-resolve insufficient");
          return;
        }

        if (resolution.status === "AUTO_RESOLVED") {
          const grade = Grade.toInt(resolution.grade);

          await user.writeFinalMark({
            studentId,
            grade,
            unitOfAssessmentId,
            comment: "Auto-resolved",
          });

          await mailer.notifyAutoResolve(
            student,
            resolution.grade,
            supervisor,
            reader,
          );

          return;
        }

        // goes to negotiation - write nothing to db but do email markers
        if (resolution.status === "NEGOTIATE1") {
          await mailer.notifyNegotiate1(supervisor, reader, project, student);
        }
        if (resolution.status === "NEGOTIATE2") {
          await mailer.notifyNegotiate2(supervisor, reader, project, student);
        }
      },
    ),

  saveMarks: procedure.instance
    .inStage([Stage.MARK_SUBMISSION])
    .marker.input(partialMarkingSubmissionDtoSchema)
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
