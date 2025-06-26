import { z } from "zod";

import {
  getAllocPairs,
  getStudentRank,
} from "@/lib/utils/allocation-adjustment/rank";
import { expand } from "@/lib/utils/general/instance-params";
import { getRandomInt } from "@/lib/utils/general/random";
import {
  projectInfoSchema,
  studentRowSchema,
} from "@/lib/validations/allocation-adjustment";
import { allocationCsvDataSchema } from "@/lib/validations/allocation-csv-data";
import { instanceParamsSchema } from "@/lib/validations/params";

import { procedure } from "@/server/middleware";
import { createTRPCRouter } from "@/server/trpc";
import { AllocationMethod } from "@/db/types";

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
    .mutation(
      async ({ ctx: { instance } }) => await instance.clearAlgSelection(),
    ),

  // ok
  clearAll: procedure.instance.subGroupAdmin
    .output(z.void())
    .mutation(
      async ({ ctx: { instance } }) => await instance.clearAllAlgResults(),
    ),

  // TODO
  updateAllocation: procedure.instance.subGroupAdmin
    .input(
      z.object({
        allProjects: z.array(projectInfoSchema),
        allStudents: z.array(studentRowSchema),
      }),
    )
    .mutation(
      async ({
        ctx: { instance, db },
        input: { allProjects, allStudents },
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

        const updatedAllocations = allocPairs.map(({ projectId, userId }) => ({
          projectId,
          userId,
          studentRanking: getStudentRank(allStudents, userId, projectId),
        }));

        const preAllocatedStudentIds = await instance
          .getPreAllocations()
          .then((d) => d.map((d) => d.student.id));

        await db.$transaction([
          db.studentProjectAllocation.deleteMany({
            where: {
              ...expand(instance.params),
              userId: { notIn: preAllocatedStudentIds },
            },
          }),

          db.studentProjectAllocation.createMany({
            data: updatedAllocations.map((e) => ({
              ...expand(instance.params),
              projectId: e.projectId,
              userId: e.userId,
              studentRanking: e.studentRanking,
            })),
          }),
        ]);
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
  getRandomAllocation: procedure.instance.subGroupAdmin
    .input(z.object({ studentId: z.string() }))
    .mutation(async ({ ctx: { instance, db }, input: { studentId } }) => {
      const projects = await instance.getStudentSuitableProjects(studentId);

      console.log(
        `Found ${projects.length} suitable projects for student ${studentId}`,
      );

      const randomIdx = getRandomInt(projects.length - 1);
      const randomAllocation = projects[randomIdx];

      if (!randomAllocation) throw new Error("No suitable projects found");

      await db.$transaction([
        db.studentSubmittedPreference.deleteMany({
          where: { ...expand(instance.params), userId: studentId },
        }),

        db.studentSubmittedPreference.create({
          data: {
            ...expand(instance.params),
            projectId: randomAllocation.id,
            userId: studentId,
            rank: 1,
          },
        }),

        db.studentProjectAllocation.upsert({
          where: {
            studentProjectAllocationId: {
              ...expand(instance.params),
              userId: studentId,
            },
          },
          create: {
            ...expand(instance.params),
            projectId: randomAllocation.id,
            userId: studentId,
            studentRanking: 1,
            allocationMethod: AllocationMethod.RANDOM,
          },
          update: {
            projectId: randomAllocation.id,
            studentRanking: 1,
            allocationMethod: AllocationMethod.RANDOM,
          },
        }),
      ]);
    }),

  // pin
  getRandomAllocationForAll: procedure.instance.subGroupAdmin.mutation(
    async ({ ctx: { instance, db } }) => {
      const { selectedAlgConfigId: selectedAlgName } = await instance.get();
      if (!selectedAlgName) return;

      const data = await instance.getAllocatedStudentsByMethods([
        AllocationMethod.RANDOM,
      ]);

      // wtf Petro?
      for (const { student } of data) {
        const projects = await instance.getStudentSuitableProjects(student.id);
        const randomIdx = getRandomInt(projects.length - 1);
        const randomAllocation = projects[randomIdx];

        if (!randomAllocation) throw new Error("No suitable projects found");

        await db.$transaction([
          db.studentSubmittedPreference.deleteMany({
            where: { ...expand(instance.params), userId: student.id },
          }),

          db.studentSubmittedPreference.create({
            data: {
              ...expand(instance.params),
              projectId: randomAllocation.id,
              userId: student.id,
              rank: 1,
            },
          }),

          db.studentProjectAllocation.upsert({
            where: {
              studentProjectAllocationId: {
                ...expand(instance.params),
                userId: student.id,
              },
            },
            create: {
              ...expand(instance.params),
              projectId: randomAllocation.id,
              userId: student.id,
              studentRanking: 1,
              allocationMethod: AllocationMethod.RANDOM,
            },
            update: {
              projectId: randomAllocation.id,
              studentRanking: 1,
              allocationMethod: AllocationMethod.RANDOM,
            },
          }),
        ]);
      }
    },
  ),

  // ok
  removeAllocation: procedure.instance.subGroupAdmin
    .input(z.object({ studentId: z.string() }))
    .output(z.void())
    .mutation(
      async ({ ctx: { instance }, input: { studentId } }) =>
        await instance.deleteStudentAllocation(studentId),
    ),
});
