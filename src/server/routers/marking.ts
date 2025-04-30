import { MarkerType, Stage } from "@/db/types";
import { procedure } from "../middleware";
import { createTRPCRouter } from "../trpc";
import { subsequentStages } from "@/lib/utils/permissions/stage-check";
import { expand } from "@/lib/utils/general/instance-params";
import { Transformers as T } from "@/db/transformers";
import { z } from "zod";
import {
  GradingStatus,
  MarkerStatusSummary,
  ProjectMarkingOverview,
  projectMarkingOverviewSchema,
} from "@/app/(protected)/[group]/[subGroup]/[instance]/(admin-panel)/(stage-specific)/(stage-9)/marking-overview/row";
// TODO: fix
import { MarkingSubmissionDTO, UserDTO } from "@/dto";
import { Grade } from "@/config/grades";

export const markingRouter = createTRPCRouter({
  byProjectMarkingSummary: procedure.instance
    .inStage(subsequentStages(Stage.MARK_SUBMISSION))
    .subGroupAdmin.output(z.array(projectMarkingOverviewSchema))
    .query(async ({ ctx: { db, instance } }) => {
      const { id: seyp_flag_id } = await db.flag.findUniqueOrThrow({
        where: {
          title_allocationGroupId_allocationSubGroupId_allocationInstanceId: {
            ...expand(instance.params),
            title: "SEYP",
          },
        },
        select: { id: true },
      });

      const projectStudentDataRaw = await db.studentProjectAllocation
        .findMany({
          where: {
            ...expand(instance.params),
            OR: [
              { student: { studentLevel: { equals: 4 } } },
              {
                student: {
                  studentFlags: { some: { flagId: { equals: seyp_flag_id } } },
                },
              },
            ],
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
                studentFlags: { include: { flag: true } },
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
        .then((data) => data.map(T.toUnitOfAssessmentDTO));

      const submissions = await db.markingSubmission.findMany({
        where: {
          unitOfAssessmentId: { in: units.map((e) => e.id) },
          draft: false,
        },
      });

      // below is:
      // data[studentId][unitId][markerId]
      const submissions_ByMarker_ByUnit_ByStudentId = submissions
        .map(T.toMarkingSubmissionDTO)
        .reduce(
          (acc, val) => {
            const prev_by_unit = acc[val.studentId] ?? {};
            const prev_by_marker = prev_by_unit[val.unitOfAssessmentId];
            return {
              ...acc,
              [val.studentId]: {
                ...prev_by_unit,
                [val.unitOfAssessmentId]: {
                  ...prev_by_marker,
                  [val.markerId]: val,
                },
              },
            };
          },
          {} as Record<
            string,
            Record<string, Record<string, MarkingSubmissionDTO>>
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

          const applicableUnits = units.filter((u) =>
            student.flags.map((f) => f.id).includes(u.flag.id),
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

              return {
                markerType,
                marker,
                status: submission
                  ? { status: GradingStatus.MARKED, grade: submission.grade }
                  : { status: GradingStatus.PENDING },
              } satisfies MarkerStatusSummary;
            });

            const unitFinalGrade = unitFinalMarksByUnit[u.id];

            return {
              status: unitFinalGrade
                ? { status: GradingStatus.MARKED, grade: unitFinalGrade.grade }
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
                : { status: GradingStatus.MARKED, grade: finalMark },
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
    .mutation(async ({ ctx: { mailer }, input: { markers, params } }) => {
      console.log(markers.map((e) => e.email));
      await mailer.notifyGenericMarkingOverdue({ params, markers });
    }),

  sendOverdueNegotiationReminder: procedure.instance
    .inStage(subsequentStages(Stage.MARK_SUBMISSION))
    .subGroupAdmin.output(z.void())
    .input(z.object({ markers: z.array(z.object({ email: z.string() })) }))
    .mutation(async ({ ctx: { mailer }, input: { markers } }) => {
      await mailer.notifyGenericNegotiationOverdue({ markers });
    }),
});
