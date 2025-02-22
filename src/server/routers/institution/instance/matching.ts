import { z } from "zod";

import {
  getAllocPairs,
  getStudentRank,
} from "@/lib/utils/allocation-adjustment/rank";
import { expand, toInstanceId } from "@/lib/utils/general/instance-params";
import {
  projectInfoSchema,
  studentRowSchema,
  supervisorDetailsSchema,
} from "@/lib/validations/allocation-adjustment";
import { allocationCsvDataSchema } from "@/lib/validations/allocation-csv-data";
import { instanceParamsSchema } from "@/lib/validations/params";

import { procedure } from "@/server/middleware";
import { createTRPCRouter, instanceAdminProcedure } from "@/server/trpc";

import { randomAllocationTrx } from "../../../../db/transactions/random-allocation";

import { getPreAllocatedStudents } from "@/db/transactions/pre-allocated-students";
import { getUnallocatedStudents } from "@/db/transactions/unallocated-students";

export const matchingRouter = createTRPCRouter({
  // ok
  select: procedure.instance.subGroupAdmin
    .input(z.object({ algId: z.string() }))
    .output(z.void())
    .mutation(
      async ({ ctx: { instance }, input: { algId } }) =>
        await instance.selectAlg(algId),
    ),

  // ok
  clearSelection: procedure.instance.subGroupAdmin
    .input(z.object({ params: instanceParamsSchema }))
    .output(z.void())
    .mutation(async ({ ctx: { instance, db }, input: { params } }) => {
      const preAllocatedStudentIds = await instance
        .getPreAllocatedStudentIds()
        .then((d) => Array.from(d));

      await db.$transaction([
        db.studentProjectAllocation.deleteMany({
          where: {
            ...expand(params),
            userId: { notIn: preAllocatedStudentIds },
          },
        }),

        db.allocationInstance.update({
          where: { instanceId: toInstanceId(instance.params) },
          data: { selectedAlgConfigId: null },
        }),
      ]);
    }),

  // ok
  clearAll: procedure.instance.subGroupAdmin
    .output(z.void())
    .mutation(async ({ ctx: { instance, db } }) => {
      const preAllocatedStudentIds = await instance
        .getPreAllocatedStudentIds()
        .then((d) => Array.from(d));

      await db.$transaction([
        db.matchingResult.deleteMany({
          where: expand(instance.params),
        }),

        db.allocationInstance.update({
          where: { instanceId: toInstanceId(instance.params) },
          data: { selectedAlgConfigId: null },
        }),

        db.studentProjectAllocation.deleteMany({
          where: {
            ...expand(instance.params),
            userId: { notIn: preAllocatedStudentIds },
          },
        }),
      ]);
    }),

  rowData: procedure.instance.subGroupAdmin
    .output(
      z.object({
        students: z.array(studentRowSchema),
        projects: z.array(projectInfoSchema),
        supervisors: z.array(supervisorDetailsSchema),
      }),
    )
    .query(async ({ ctx: { db, instance } }) => {
      const studentData = await instance.getStudentPreferenceDetails();

      const projectData = await db.projectInInstance.findMany({
        where: expand(instance.params),
        include: { supervisor: true },
      });

      const supervisorData = await instance.getSupervisorProjectDetails();

      const supervisors = supervisorData.map((s) => ({
        supervisorId: s.institutionId,
        lowerBound: 0,
        target: s.projectTarget,
        upperBound: s.projectUpperQuota,
        projects: s.projects.map((e) => e.id),
      }));

      const allocationData = await db.studentProjectAllocation.findMany({
        where: expand(instance.params),
        select: { projectId: true, userId: true },
      });

      const allocationRecord = allocationData.reduce(
        (allocationRecord, { projectId, userId }) => {
          if (!allocationRecord[projectId]) {
            allocationRecord[projectId] = [];
          }

          allocationRecord[projectId].push(userId);
          return allocationRecord;
        },
        {} as Record<string, string[]>,
      );

      //       const projectDetails = projectData.reduce(
      //         (acc, p) => ({
      //           ...acc,
      //           [p.projectId]: { id:p.projectId,
      // title:p.title,

      //            } satisfies ProjectInfo,
      //         }),
      //         {} as Record<string, ProjectInfo>,
      //       );

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
    }),

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

  // ok
  exportCsvData: procedure.instance.subGroupAdmin
    .output(z.array(allocationCsvDataSchema))
    .query(async ({ ctx: { instance } }) => {
      const allocationData = await instance.getAllocationData();
      return allocationData.toExportData();
    }),

  // pin
  getRandomAllocation: instanceAdminProcedure
    .input(z.object({ params: instanceParamsSchema, studentId: z.string() }))
    .mutation(async ({ ctx, input: { params, studentId } }) => {
      await randomAllocationTrx(ctx.db, params, studentId);
    }),

  // pin
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

      // wtf Petro?
      for (const { student } of data) {
        await randomAllocationTrx(ctx.db, params, student.id);
      }
    }),

  // ok
  removeAllocation: procedure.instance.subGroupAdmin
    .input(z.object({ studentId: z.string() }))
    .output(z.void())
    .mutation(
      async ({ ctx: { instance }, input: { studentId } }) =>
        await instance.deleteStudentAllocation(studentId),
    ),
});
