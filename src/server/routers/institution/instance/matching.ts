import { z } from "zod";

import {
  getAllocPairs,
  getStudentRank,
} from "@/lib/utils/allocation-adjustment/rank";
import { toSupervisorDetails } from "@/lib/utils/allocation-adjustment/supervisor";
import { guidToMatric } from "@/lib/utils/external/matriculation";
import { expand } from "@/lib/utils/general/instance-params";
import {
  ProjectDetails,
  projectInfoSchema,
  studentRowSchema,
} from "@/lib/validations/allocation-adjustment";
import { matchingResultSchema } from "@/lib/validations/matching";
import { instanceParamsSchema } from "@/lib/validations/params";

import { procedure } from "@/server/middleware";
import { createTRPCRouter, instanceAdminProcedure } from "@/server/trpc";
import { getUnallocatedStudents } from "@/server/utils/instance/unallocated-students";

import { randomAllocationTrx } from "./algorithm/_utils/random-allocation";
import { updateAllocation } from "./algorithm/_utils/update-allocation";

import { getPreAllocatedStudents } from "@/db/transactions/pre-allocated-students";

export const matchingRouter = createTRPCRouter({
  select: procedure.instance.subgroupAdmin
    .input(z.object({ algId: z.string() }))
    .output(z.void())
    .mutation(async ({ ctx, input: { algId, params } }) => {
      await ctx.db.$transaction(async (tx) => {
        const { matchingResult } =
          await tx.algorithmConfigInInstance.findFirstOrThrow({
            where: { ...expand(params), algorithmConfigId: algId },
            select: { matchingResult: true },
          });

        const matchingData = matchingResult.matching?.toString();
        if (!matchingData) throw new Error("!!s");

        const { matching } = matchingResultSchema.parse(
          JSON.parse(matchingData),
        );

        const prevMatchingExists = ctx.instance.selectedAlgName;
        if (prevMatchingExists) {
          const preAllocatedStudents = await getPreAllocatedStudents(
            tx,
            params,
          ).then((data) => Array.from(data));

          await tx.studentProjectAllocation.deleteMany({
            where: {
              ...expand(params),
              userId: { notIn: preAllocatedStudents },
            },
          });
        }

        await tx.studentProjectAllocation.createMany({
          data: matching
            .filter((e) => e.project_id !== "0")
            .map(({ student_id, project_id, preference_rank }) => ({
              ...expand(params),
              userId: student_id,
              projectId: project_id,
              studentRanking: preference_rank,
            })),
        });

        await tx.allocationInstance.update({
          where: {
            instanceId: {
              allocationGroupId: group,
              allocationSubGroupId: subGroup,
              id: instance,
            },
          },
          data: { selectedAlgName: algName },
        });
      });
    }),

  clearSelection: instanceAdminProcedure
    .input(z.object({ params: instanceParamsSchema }))
    .mutation(async ({ ctx, input: { params } }) => {
      await ctx.db.$transaction(async (tx) => {
        const preAllocatedStudents = await getPreAllocatedStudents(
          tx,
          params,
        ).then((data) => Array.from(data));

        await tx.projectAllocation.deleteMany({
          where: { ...expand(params), userId: { notIn: preAllocatedStudents } },
        });

        await tx.allocationInstance.update({
          where: {
            instanceId: {
              allocationGroupId: params.group,
              allocationSubGroupId: params.subGroup,
              id: params.instance,
            },
          },
          data: { selectedAlgName: null },
        });
      });
    }),

  clearAll: instanceAdminProcedure
    .input(z.object({ params: instanceParamsSchema }))
    .mutation(async ({ ctx, input: { params } }) => {
      await ctx.db.$transaction(async (tx) => {
        await tx.algorithm.updateMany({
          where: { ...expand(params) },
          data: { matchingResultData: JSON.stringify({}) },
        });

        await tx.allocationInstance.update({
          where: {
            instanceId: {
              allocationGroupId: params.group,
              allocationSubGroupId: params.subGroup,
              id: params.instance,
            },
          },
          data: { selectedAlgName: null },
        });

        const preAllocatedStudents = await getPreAllocatedStudents(
          tx,
          params,
        ).then((data) => Array.from(data));

        await tx.projectAllocation.deleteMany({
          where: { ...expand(params), userId: { notIn: preAllocatedStudents } },
        });
      });
    }),

  // TODO: refactor to use transaction and extract util functions
  rowData: instanceAdminProcedure
    .input(z.object({ params: instanceParamsSchema }))
    .query(
      async ({
        ctx,
        input: {
          params: { group, subGroup, instance },
        },
      }) => {
        const studentData = await ctx.db.studentDetails.findMany({
          where: {
            allocationGroupId: group,
            allocationSubGroupId: subGroup,
            allocationInstanceId: instance,
          },
          select: {
            userInInstance: {
              select: { user: { select: { id: true, name: true } } },
            },
            preferences: {
              select: {
                project: {
                  select: {
                    id: true,
                    allocations: { select: { userId: true } },
                  },
                },
                rank: true,
              },
              orderBy: { rank: "asc" },
            },
          },
        });

        const projectData = await ctx.db.project.findMany({
          where: {
            allocationGroupId: group,
            allocationSubGroupId: subGroup,
            allocationInstanceId: instance,
          },
          select: {
            id: true,
            title: true,
            capacityLowerBound: true,
            capacityUpperBound: true,
            supervisor: {
              select: {
                supervisorInstanceDetails: {
                  where: {
                    allocationGroupId: group,
                    allocationSubGroupId: subGroup,
                    allocationInstanceId: instance,
                  },
                  select: {
                    projectAllocationLowerBound: true,
                    projectAllocationTarget: true,
                    projectAllocationUpperBound: true,
                  },
                },
              },
            },
          },
        });

        const supervisorData = await ctx.db.supervisorInstanceDetails.findMany({
          where: {
            allocationGroupId: group,
            allocationSubGroupId: subGroup,
            allocationInstanceId: instance,
          },
          select: {
            projectAllocationLowerBound: true,
            projectAllocationTarget: true,
            projectAllocationUpperBound: true,
            userId: true,
            userInInstance: {
              select: {
                supervisorProjects: {
                  select: {
                    id: true,
                    allocations: { select: { userId: true } },
                  },
                },
              },
            },
          },
        });

        const supervisors = supervisorData.map((s) => toSupervisorDetails(s));

        const allocationData = await ctx.db.projectAllocation.findMany({
          where: {
            allocationGroupId: group,
            allocationSubGroupId: subGroup,
            allocationInstanceId: instance,
          },
          select: { projectId: true, userId: true },
        });

        // TODO: use reduce
        const allocationRecord: Record<string, string[]> = {};
        allocationData.forEach(({ projectId, userId }) => {
          if (!allocationRecord[projectId]) allocationRecord[projectId] = [];
          allocationRecord[projectId].push(userId);
        });

        // TODO: use reduce
        const projectDetails: Record<string, ProjectDetails> = {};
        projectData.forEach(({ id, ...rest }) => {
          projectDetails[id] = {
            ...rest,
            allocatedTo: allocationRecord[id] ?? [],
          };
        });

        const students = studentData
          .map(({ userInInstance: { user }, preferences }) => ({
            student: { id: user.id, name: user.name! },
            projects: preferences.map(({ project: { id, allocations } }) => ({
              id,
              selected:
                allocations.filter((u) => u.userId === user.id).length === 1,
            })),
          }))
          .filter((e) => e.projects.length > 0);

        const projects = projectData.map((p) => {
          const supervisor = p.supervisor.supervisorInstanceDetails[0];
          return {
            id: p.id,
            title: p.title,
            capacityLowerBound: p.capacityLowerBound,
            capacityUpperBound: p.capacityUpperBound,
            allocatedTo: allocationRecord[p.id] ?? [],
            projectAllocationLowerBound: supervisor.projectAllocationLowerBound,
            projectAllocationTarget: supervisor.projectAllocationTarget,
            projectAllocationUpperBound: supervisor.projectAllocationUpperBound,
          };
        });

        return { students, projects, supervisors };
      },
    ),

  updateAllocation: instanceAdminProcedure
    .input(
      z.object({
        params: instanceParamsSchema,
        allProjects: z.array(projectInfoSchema),
        allStudents: z.array(studentRowSchema),
      }),
    )
    .mutation(
      async ({
        ctx,
        input: {
          params: { group, subGroup, instance },
          allProjects,
          allStudents,
        },
      }) => {
        /**
         * ? How do I calculate the updated allocations?
         *
         * obviously that information is encoded in the updated projects supplied to the procedure
         * but the projects themselves have no notion of what position in each student's preference list
         * they were
         *
         * that information exists on the student rows which is why they too are supplied to the procedure
         * so what I need to do is generate the new flat array from the projects and for each student in the projects
         * find what position they ranked the project they've been assigned to
         */
        const allocPairs = getAllocPairs(allProjects);

        const updatedAllocations = allocPairs.map(({ projectId, userId }) => {
          return {
            projectId,
            userId,
            studentRanking: getStudentRank(allStudents, userId, projectId),
          };
        });

        await ctx.db.$transaction(async (tx) => {
          const preAllocatedStudents = await getPreAllocatedStudents(tx, {
            group,
            subGroup,
            instance,
          }).then((data) => Array.from(data));

          await tx.projectAllocation.deleteMany({
            where: {
              allocationGroupId: group,
              allocationSubGroupId: subGroup,
              allocationInstanceId: instance,
              userId: { notIn: preAllocatedStudents },
            },
          });

          await tx.projectAllocation.createMany({
            data: updatedAllocations.map((e) => ({
              ...e,
              allocationGroupId: group,
              allocationSubGroupId: subGroup,
              allocationInstanceId: instance,
            })),
          });
        });
      },
    ),

  exportCsvData: instanceAdminProcedure
    .input(z.object({ params: instanceParamsSchema }))
    .query(
      async ({
        ctx,
        input: {
          params: { group, subGroup, instance },
        },
      }) => {
        const allocationData = await ctx.db.projectAllocation.findMany({
          where: {
            allocationGroupId: group,
            allocationSubGroupId: subGroup,
            allocationInstanceId: instance,
          },
          select: {
            project: { include: { supervisor: { select: { user: true } } } },
            student: { select: { user: true, studentDetails: true } },
            studentRanking: true,
          },
        });

        return allocationData
          .map(({ project, student, ...e }) => ({
            project: {
              ...project,
              supervisor: project.supervisor.user,
              specialTechnicalRequirements:
                project.specialTechnicalRequirements ?? "",
            },
            student: {
              id: student.user.id,
              name: student.user.name,
              matric: guidToMatric(student.user.id),
              level: student.studentDetails[0].studentLevel, // TODO: move project allocation information to studentDetails table
              email: student.user.email,
              ranking: e.studentRanking,
            },
            supervisor: project.supervisor.user,
          }))
          .sort((a, b) => a.student.id.localeCompare(b.student.id));
      },
    ),

  getRandomAllocation: instanceAdminProcedure
    .input(z.object({ params: instanceParamsSchema, studentId: z.string() }))
    .mutation(async ({ ctx, input: { params, studentId } }) => {
      await randomAllocationTrx(ctx.db, params, studentId);
    }),

  getRandomAllocationForAll: instanceAdminProcedure
    .input(z.object({ params: instanceParamsSchema }))
    .mutation(async ({ ctx, input: { params } }) => {
      const selectedAlgName = ctx.instance.selectedAlgName;
      if (!selectedAlgName) return;

      const data = await getUnallocatedStudents(
        ctx.db,
        params,
        selectedAlgName,
      );

      for (const { student } of data) {
        await randomAllocationTrx(ctx.db, params, student.id);
      }
    }),

  removeAllocation: instanceAdminProcedure
    .input(z.object({ params: instanceParamsSchema, studentId: z.string() }))
    .mutation(async ({ ctx, input: { params, studentId } }) => {
      await updateAllocation(ctx.db, params, studentId);

      await ctx.db.savedPreference.deleteMany({
        where: { ...expand(params), userId: studentId },
      });
    }),
});
