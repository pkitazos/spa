import { Stage } from "@/db/types";
import { procedure } from "../middleware";
import { createTRPCRouter } from "../trpc";
import { subsequentStages } from "@/lib/utils/permissions/stage-check";
import { expand } from "@/lib/utils/general/instance-params";
import { Transformers as T } from "@/db/transformers";
import { z } from "zod";
import {
  MarkerStatusSummary,
  ProjectMarkingOverview,
  projectMarkingOverviewSchema,
  type UnitMarkingSummary,
} from "@/app/(protected)/[group]/[subGroup]/[instance]/(admin-panel)/(stage-specific)/(stage-9)/marking-overview/row";
import { MarkingSubmissionDTO, UserDTO } from "@/dto";

export const markingRouter = createTRPCRouter({
  byProjectMarkingSummary: procedure.instance
    .inStage(subsequentStages(Stage.MARK_SUBMISSION))
    .subGroupAdmin.output(z.array(projectMarkingOverviewSchema))
    .query(async ({ ctx: { db, instance } }) => {
      const projectStudentDataRaw = await db.studentProjectAllocation
        .findMany({
          where: expand(instance.params),
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
        include: { criterionScores: true },
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

      const breakdowns: ProjectMarkingOverview[] = projectStudentDataRaw.map(
        ({ student, project, supervisor, reader }) => {
          const unitFinalMarksByUnit =
            unitFinalMarksByUnitByStudent[student.id] ?? {};

          const applicableUnits = units.filter((u) =>
            student.flags.map((f) => f.id).includes(u.flag.id),
          );

          const unitData: UnitMarkingSummary[] = applicableUnits.map((u) => {
            const markers: MarkerStatusSummary[] = u.allowedMarkerTypes.map(
              (markerType) => {
                let marker: UserDTO;
                if (markerType === "SUPERVISOR") {
                  marker = T.toUserDTO(supervisor);
                } else {
                  marker = T.toUserDTO(reader);
                }

                const submission =
                  submissions_ByMarker_ByUnit_ByStudentId[student.id][u.id][
                    marker.id
                  ];

                return {
                  markerType,
                  marker,
                  status: submission
                    ? { status: "MARKED", grade: submission.grade }
                    : { status: "PENDING" },
                };
              },
            );

            const unitFinalGrade = unitFinalMarksByUnit[u.id];

            return {
              status: unitFinalGrade
                ? { status: "MARKED", grade: unitFinalGrade.grade }
                : { status: "PENDING" },
              unit: u,
              markers,
            };
          });

          const finalMark = overallFinalMarksByStudent[student.id];

          return {
            student,
            project,
            status:
              finalMark === undefined
                ? { status: "PENDING" }
                : { status: "MARKED", grade: finalMark },
            units: unitData,
          };
        },
      );

      return breakdowns;
    }),
});
