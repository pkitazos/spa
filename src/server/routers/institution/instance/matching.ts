import { z } from "zod";

import {
  getAllocPairs,
  getStudentRank,
} from "@/lib/utils/allocation-adjustment/rank";
import { expand, toInstanceId } from "@/lib/utils/general/instance-params";
import { getRandomInt } from "@/lib/utils/general/random";
import {
  projectDetailsSchema,
  projectInfoSchema,
  studentRowSchema,
  supervisorDetailsSchema,
} from "@/lib/validations/allocation-adjustment";
import { allocationCsvDataSchema } from "@/lib/validations/allocation-csv-data";
import { instanceParamsSchema } from "@/lib/validations/params";

import { procedure } from "@/server/middleware";
import { createTRPCRouter } from "@/server/trpc";

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
        db.matchingResult.deleteMany({ where: expand(instance.params) }),

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

  // BREAKING
  // move, maybe rename
  // change output type to something more standard
  rowData: procedure.instance.subGroupAdmin
    .output(
      z.object({
        students: z.array(studentRowSchema),
        projects: z.array(projectDetailsSchema),
        supervisors: z.array(supervisorDetailsSchema),
      }),
    )
    .query(async ({ ctx: { instance } }) => {
      const studentData = await instance.getStudentPreferenceDetails();
      const projectData = await instance.getProjectDetails();
      const supervisorData = await instance.getSupervisorProjectDetails();

      const allocationRecord = await instance
        .getAllocationData()
        .then((data) => data.toRecord());

      const supervisors = supervisorData.map((s) => ({
        supervisorId: s.institutionId,
        lowerBound: 0,
        target: s.projectTarget,
        upperBound: s.projectUpperQuota,
        projects: s.projects.map((e) => e.id),
      }));

      const students = studentData
        .map((s) => ({
          student: { id: s.institutionId, name: s.fullName },
          projects: s.submittedPreferences.map(({ projectId: id }) => ({
            id,
            selected: allocationRecord[id]?.includes(s.institutionId) ?? false,
          })),
        }))
        .filter((e) => e.projects.length > 0);

      const projects = projectData.map((p) => ({
        capacityLowerBound: p.details.capacityLowerBound,
        capacityUpperBound: p.details.capacityUpperBound,
        allocatedTo: p.studentAllocations.map((e) => e.userId),
        supervisor: p.supervisor,
      }));

      return { supervisors, students, projects };
    }),

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

        const preAllocatedStudentIds =
          await instance.getPreAllocatedStudentIds();

        await db.$transaction([
          db.studentProjectAllocation.deleteMany({
            where: {
              ...expand(instance.params),
              userId: { notIn: Array.from(preAllocatedStudentIds) },
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
          },
          update: { projectId: randomAllocation.id, studentRanking: 1 },
        }),
      ]);
    }),

  // pin
  getRandomAllocationForAll: procedure.instance.subGroupAdmin.mutation(
    async ({ ctx: { instance, db } }) => {
      const { selectedAlgConfigId: selectedAlgName } = await instance.get();
      if (!selectedAlgName) return;

      const data = await instance.getStudentsForRandomAllocation();

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
            },
            update: { projectId: randomAllocation.id, studentRanking: 1 },
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
