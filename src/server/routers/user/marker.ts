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
  MarkingSubmissionDTO,
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
        ctx: { user },
        input: { studentId, unitOfAssessmentId, grade, comment },
      }) =>
        await user.writeFinalMark({
          studentId,
          unitOfAssessmentId,
          grade,
          comment,
        }),
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
        const unit = await instance.getUnitOfAssessment(unitOfAssessmentId);
        const { allowedMarkerTypes, components } = unit;

        if (!allowedMarkerTypes.includes(markerType)) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "User is not correct marker type",
          });
        }

        const grade = Grade.computeFromScores(
          components.map((c) => ({
            weight: c.weight,
            score: marks[c.id].mark,
          })),
        );

        await user.writeMarks({
          grade,
          unitOfAssessmentId,
          studentId,
          marks,
          finalComment,
          recommendation,
          draft: false,
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

        const submissionByMarker = data.reduce(
          (acc, val) => ({
            ...acc,
            [val.markerId]: T.toMarkingSubmissionDTO(val),
          }),
          {} as Record<string, MarkingSubmissionDTO>,
        );

        const studentDO = new Student(db, studentId, params);

        const student = await studentDO.get();
        const { supervisor, project } = await studentDO.getAllocation();

        const reader: ReaderDTO = await studentDO.getReader();

        // run the auto-resolve function on the grades.
        const resolution = Grade.autoResolve(
          Grade.toLetter(submissionByMarker[supervisor.id].grade),
          Grade.toLetter(submissionByMarker[reader.id].grade),
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

        if (
          resolution.status === "NEGOTIATE1" ||
          resolution.status === "NEGOTIATE2"
        ) {
          // goes to negotiation - write nothing to db but do email markers
          const readerMarking = {
            submission: submissionByMarker[reader.id],
            criteria: components,
            overallGrade: submissionByMarker[reader.id].grade,
          };
          const supervisorMarking = {
            submission: submissionByMarker[supervisor.id],
            criteria: components,
            overallGrade: submissionByMarker[supervisor.id].grade,
          };

          await mailer.notifyNegotiate(
            supervisor,
            reader,
            project,
            student,
            readerMarking,
            supervisorMarking,
            unit,
            params,
          );
          return;
        }
        if (resolution.status === "MODERATE") {
          await mailer.notifyModeration(supervisor, reader, project, student);
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
