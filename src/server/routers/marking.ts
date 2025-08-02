import {
  GradingStatus,
  type MarkerStatusSummary,
  type ProjectMarkingOverview,
  projectMarkingOverviewSchema,
} from "@/app/(protected)/[group]/[subGroup]/[instance]/(admin-panel)/(stage-specific)/(stage-9)/marking-overview/row";
import { z } from "zod";

import { Grade } from "@/config/grades";

import { type MarkingSubmissionDTO, type UserDTO } from "@/dto";

import { Transformers as T } from "@/db/transformers";
import { MarkerType, Stage } from "@/db/types";

import { LogLevels } from "@/lib/logging/logger";
import { expand } from "@/lib/utils/general/instance-params";
import { subsequentStages } from "@/lib/utils/permissions/stage-check";

import { procedure } from "../middleware";
import { createTRPCRouter } from "../trpc";

// TODO: fix
export const markingRouter = createTRPCRouter({
  byProjectMarkingSummary: procedure.instance
    .inStage(subsequentStages(Stage.MARK_SUBMISSION))
    .subGroupAdmin.output(z.array(projectMarkingOverviewSchema))
    .query(async ({ ctx: { db, instance } }) => {
      const { id: seyp_flag_id } = await db.flag.findUniqueOrThrow({
        where: {
          displayName_allocationGroupId_allocationSubGroupId_allocationInstanceId:
            { ...expand(instance.params), displayName: "SEYP" },
        },
        select: { id: true },
      });

      const projectStudentDataRaw = await db.studentProjectAllocation
        .findMany({
          where: {
            ...expand(instance.params),
            OR: [{ student: { studentFlag: { id: seyp_flag_id } } }],
          },
          include: {
            project: {
              include: {
                readerAllocations: {
                  include: {
                    reader: {
                      include: { userInInstance: { include: { user: true } } },
                    },
                  },
                },
                supervisor: {
                  include: { userInInstance: { include: { user: true } } },
                },
                flagsOnProject: { include: { flag: true } },
                tagsOnProject: { include: { tag: true } },
              },
            },
            student: {
              include: {
                userInInstance: { include: { user: true } },
                studentFlag: true,
              },
            },
          },
        })
        .then((data) =>
          data.map(({ project, student }) => ({
            project: T.toProjectDTO(project),
            student: T.toStudentDTO(student),
            supervisor: T.toSupervisorDTO(project.supervisor),
            reader: project.readerAllocations.map(({ reader }) =>
              T.toReaderDTO(reader),
            )[0],
          })),
        );

      const units = await db.unitOfAssessment
        .findMany({
          where: expand(instance.params),
          include: { flag: true, assessmentCriteria: true },
        })
        .then((data) => data.map((x) => T.toUnitOfAssessmentDTO(x)));

      const submissions = await db.markingSubmission.findMany({
        where: {
          unitOfAssessmentId: { in: units.map((e) => e.id) },
          draft: false,
        },
        include: {
          criterionScores: {
            include: { criterion: true },
            orderBy: { criterion: { layoutIndex: "asc" } },
          },
        },
      });

      // below is:
      // data[studentId][unitId][markerId]
      const submissions_ByMarker_ByUnit_ByStudentId = submissions
        .map((x) => ({
          submission: T.toMarkingSubmissionDTO(x),
          comments: x.criterionScores,
        }))
        .reduce(
          (acc, { submission, comments }) => {
            const prev_by_unit = acc[submission.studentId] ?? {};
            const prev_by_marker = prev_by_unit[submission.unitOfAssessmentId];

            const comment =
              comments.reduce((acc, val) => {
                const rest = val.criterion.title + "\t" + val.justification;
                return acc + "\t\t" + rest;
              }, "") +
              "\t\tFinal Comment:\t" +
              submission.finalComment;

            // console.log(comment);

            return {
              ...acc,
              [submission.studentId]: {
                ...prev_by_unit,
                [submission.unitOfAssessmentId]: {
                  ...prev_by_marker,
                  [submission.markerId]: { submission, comment },
                },
              },
            };
          },
          {} as Record<
            string,
            Record<
              string,
              Record<
                string,
                { submission: MarkingSubmissionDTO; comment: string }
              >
            >
          >,
        );

      const unitFinalMarks = await db.finalUnitOfAssessmentGrade.findMany({
        where: { unitOfAssessmentId: { in: units.map((e) => e.id) } },
      });

      // data[studentId][unitId]
      const unitFinalMarksByUnitByStudent = unitFinalMarks.reduce(
        (acc, val) => {
          const prev = acc[val.studentId] ?? {};
          return {
            ...acc,
            [val.studentId]: { ...prev, [val.unitOfAssessmentId]: val },
          };
        },
        {} as Record<
          string,
          Record<
            string,
            {
              unitOfAssessmentId: string;
              studentId: string;
              grade: number;
              comment: string;
            }
          >
        >,
      );

      const overallFinalMarks = await db.finalGrade.findMany({
        where: expand(instance.params),
      });

      const overallFinalMarksByStudent = overallFinalMarks.reduce(
        (acc, val) => ({ ...acc, [val.studentId]: val.grade }),
        {} as Record<string, number>,
      );

      const breakdowns = projectStudentDataRaw.map(
        async ({ student, project, supervisor, reader }) => {
          const unitFinalMarksByUnit =
            unitFinalMarksByUnitByStudent[student.id] ?? {};

          const applicableUnits = units.filter(
            (u) => student.flag.id === u.flag.id,
          );

          const unitData = applicableUnits.map((u) => {
            const markers = u.allowedMarkerTypes.map((markerType) => {
              let marker: UserDTO;

              if (markerType === MarkerType.SUPERVISOR) {
                marker = T.toUserDTO(supervisor);
              } else {
                marker = reader
                  ? T.toUserDTO(reader)
                  : {
                      name: "Paul Harvey",
                      id: "phh9g",
                      email: "paul.harvey@glasgow.ac.uk",
                    };
              }

              const submission =
                submissions_ByMarker_ByUnit_ByStudentId[student.id]?.[u.id]?.[
                  marker.id
                ];

              console.log(
                submission?.submission.studentId,
                submission?.comment,
              );

              return {
                markerType,
                marker,
                status: submission
                  ? {
                      status: GradingStatus.MARKED,
                      grade: submission.submission.grade,
                      comment: submission.comment,
                    }
                  : { status: GradingStatus.PENDING },
              } satisfies MarkerStatusSummary;
            });

            const unitFinalGrade = unitFinalMarksByUnit[u.id];

            return {
              status: unitFinalGrade
                ? {
                    status: GradingStatus.MARKED,
                    grade: unitFinalGrade.grade,
                    comment: unitFinalGrade.comment,
                  }
                : { status: GradingStatus.PENDING },
              unit: u,
              markers,
            };
          });

          let finalMark = overallFinalMarksByStudent[student.id];

          if (
            finalMark === undefined &&
            unitData.every((u) => u.status.status === "MARKED")
          ) {
            finalMark = Grade.computeFromScores(
              unitData.map((e) => ({
                score: e.status.grade!,
                weight: e.unit.weight,
              })),
            );

            await db.finalGrade.create({
              data: {
                grade: finalMark,
                ...expand(instance.params),
                studentId: student.id,
              },
            });
          }

          return {
            student,
            project,
            status:
              finalMark === undefined
                ? { status: GradingStatus.PENDING }
                : {
                    status: GradingStatus.MARKED,
                    grade: finalMark,
                    comment: "",
                  },
            units: unitData,
          } satisfies ProjectMarkingOverview;
        },
      );

      return await Promise.all(breakdowns);
    }),

  sendOverdueMarkingReminder: procedure.instance
    .inStage(subsequentStages(Stage.MARK_SUBMISSION))
    .subGroupAdmin.output(z.void())
    .input(z.object({ markers: z.array(z.object({ email: z.string() })) }))
    .mutation(
      async ({ ctx: { mailer, logger, user }, input: { markers, params } }) => {
        logger.log(LogLevels.AUDIT, "Sending marking reminders", {
          numAcademics: markers.length,
          authorizerId: user.id,
        });
        await mailer.notifyGenericMarkingOverdue({ params, markers });
      },
    ),

  sendOverdueNegotiationReminder: procedure.instance
    .inStage(subsequentStages(Stage.MARK_SUBMISSION))
    .subGroupAdmin.output(z.void())
    .input(z.object({ markers: z.array(z.object({ email: z.string() })) }))
    .mutation(async ({ ctx: { mailer, logger, user }, input: { markers } }) => {
      logger.log(LogLevels.AUDIT, "sending negotiation reminders", {
        numAcademics: markers.length,
        authorizerId: user.id,
      });

      await mailer.notifyGenericNegotiationOverdue({ markers });
    }),
});
