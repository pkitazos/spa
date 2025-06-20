import { Grade } from "@/config/grades";
import { Marker } from "@/data-objects";
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
  MarkingSubmissionDTO,
} from "@/dto";
import { GradingResult } from "@/dto/result/grading-result";
import { markingSubmissionStatusSchema } from "@/dto/result/marking-submission-status";
import { subsequentStages } from "@/lib/utils/permissions/stage-check";
import { procedure } from "@/server/middleware";
import { createTRPCRouter } from "@/server/trpc";
import { TRPCError } from "@trpc/server";
import { addWeeks } from "date-fns";
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
        submission: partialMarkingSubmissionDtoSchema,
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

  resolveMarks: procedure.instance
    .inStage([Stage.MARK_SUBMISSION])
    .supervisor.input(
      z.object({
        grade: z.number(),
        comment: z.string().min(1),
        studentId: z.string(),
        unitOfAssessmentId: z.string(),
      }),
    )
    .output(z.void())
    .mutation(
      async ({
        ctx: { db, user, mailer, instance },
        input: { studentId, unitOfAssessmentId, grade, comment },
      }) => {
        // todo audit
        const studentDO = await instance.getStudent(studentId);

        const reader = await studentDO.getReader();
        const { project, supervisor } = await studentDO.getAllocation();

        const student = await studentDO.get();
        const unit = await instance.getUnitOfAssessment(unitOfAssessmentId);

        const res = Grade.checkExtremes(Grade.toLetter(grade));
        if (res.status === GradingResult.AUTO_RESOLVED) {
          await user.writeFinalMark({
            studentId,
            unitOfAssessmentId,
            grade,
            comment,
          });

          await mailer.notifyNegotiationResolved({
            grade: Grade.toLetter(grade),
            project,
            reader,
            student,
            supervisor,
            unit,
          });
        } else {
          const deadline = addWeeks(new Date(), 1);

          // otherwise, if this is a doubly-marked submission, and now both are submitted then:
          const data = await db.markingSubmission.findMany({
            where: { studentId, unitOfAssessmentId },
            include: { criterionScores: true },
          });

          const submissionByMarker = data.reduce(
            (acc, val) => ({
              ...acc,
              [val.markerId]: T.toMarkingSubmissionDTO(val),
            }),
            {} as Record<string, MarkingSubmissionDTO>,
          );

          // should notify coordinator e.g.:
          mailer.notifyModeration({
            criteria: unit.components,
            deadline,
            project,
            student,
            reader,
            supervisor,
            supervisorSubmission: submissionByMarker[supervisor.id],
            readerSubmission: submissionByMarker[reader.id],
            unit,
            negotiationResult: { mark: grade, justification: comment },
          });
        }
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
          grade,
        },
      }) => {
        // todo audit
        const markerType = await user.getMarkerType(studentId);
        const unit = await instance.getUnitOfAssessment(unitOfAssessmentId);
        const { allowedMarkerTypes, components } = unit;

        if (!allowedMarkerTypes.includes(markerType)) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "User is not correct marker type",
          });
        }

        const submission = {
          grade,
          unitOfAssessmentId,
          studentId,
          marks,
          finalComment,
          recommendation,
          draft: false,
        };

        await user.writeMarks(submission);

        const studentDO = await instance.getStudent(studentId);
        const student = await studentDO.get();
        const { supervisor, project } = await studentDO.getAllocation();

        mailer.notifyMarkingSubmitted({
          project,
          student,
          unit,
          criteria: components,
          submission: { ...submission, markerId: user.id },
          marker: await user.toDTO(),
        });

        if (allowedMarkerTypes.length === 1) {
          await user.writeFinalMark({
            studentId,
            grade,
            unitOfAssessmentId,
            comment: "Auto-resolved",
          });

          return;
        }

        const numSubmissions = await db.markingSubmission.count({
          where: { studentId, unitOfAssessmentId, draft: false },
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
          where: { studentId, unitOfAssessmentId, draft: false },
          include: { criterionScores: true },
        });

        const submissionByMarker = data.reduce(
          (acc, val) => ({
            ...acc,
            [val.markerId]: T.toMarkingSubmissionDTO(val),
          }),
          {} as Record<string, MarkingSubmissionDTO>,
        );

        const reader: ReaderDTO = await studentDO.getReader();

        const readerSubmission = submissionByMarker[reader.id];
        const supervisorSubmission = submissionByMarker[supervisor.id];

        // run the auto-resolve function on the grades.
        const resolution = Grade.autoResolve(
          Grade.toLetter(supervisorSubmission.grade),
          Grade.toLetter(readerSubmission.grade),
        );

        if (resolution.status === GradingResult.INSUFFICIENT) {
          console.error("unreachable: auto-resolve insufficient");
          return;
        }

        if (resolution.status === GradingResult.AUTO_RESOLVED) {
          const grade = Grade.toInt(resolution.grade);

          await user.writeFinalMark({
            studentId,
            grade,
            unitOfAssessmentId,
            comment: "Auto-resolved",
          });

          await mailer.notifyMarkingComplete(
            student,
            supervisor,
            reader,
            project,
            unit,
            resolution.grade,
          );

          return;
        }
        const deadline = addWeeks(new Date(), 1);

        if (
          resolution.status === GradingResult.NEGOTIATE1 ||
          resolution.status === GradingResult.NEGOTIATE2
        ) {
          // goes to negotiation - write nothing to db but do email markers

          await mailer.notifyNegotiate({
            supervisor,
            reader,
            project,
            student,
            readerSubmission,
            supervisorSubmission,
            unit,
            criteria: components,
            params,
            deadline,
          });
          return;
        }
        if (resolution.status === GradingResult.MODERATE) {
          await mailer.notifyModeration({
            supervisor,
            reader,
            project,
            student,
            unit,
            criteria: components,
            deadline,
            readerSubmission,
            supervisorSubmission,
          });
          return;
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
          grade: -1,
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
