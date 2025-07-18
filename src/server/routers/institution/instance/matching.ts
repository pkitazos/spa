import { z } from "zod";

import { procedure } from "@/server/middleware";
import { createTRPCRouter } from "@/server/trpc";

import {
  fetchRandomItemFromArray,
  getRandomInt,
} from "@/lib/utils/general/random";
import { allocationCsvDataSchema } from "@/lib/validations/allocation-csv-data";
import { instanceParamsSchema } from "@/lib/validations/params";

export const matchingRouter = createTRPCRouter({
  select: procedure.instance.subGroupAdmin
    .input(z.object({ algId: z.string() }))
    .output(z.void())
    .mutation(
      async ({ ctx: { instance }, input: { algId } }) =>
        await instance.selectAlg(algId),
    ),

  clearSelection: procedure.instance.subGroupAdmin
    .input(z.object({ params: instanceParamsSchema }))
    .output(z.void())
    .mutation(
      async ({ ctx: { instance } }) => await instance.clearAlgSelection(),
    ),

  clearAll: procedure.instance.subGroupAdmin
    .output(z.void())
    .mutation(
      async ({ ctx: { instance } }) => await instance.clearAllAlgResults(),
    ),

  exportCsvData: procedure.instance.subGroupAdmin
    .output(z.array(allocationCsvDataSchema))
    .query(async ({ ctx: { instance } }) => {
      const allocationData = await instance.getAllocationData();
      return allocationData.toExportData();
    }),

  allocateRandomProjectToStudent: procedure.instance.subGroupAdmin
    .input(z.object({ studentId: z.string() }))
    .output(z.void())
    .mutation(async ({ ctx: { instance }, input: { studentId } }) => {
      const projects = await instance.getStudentSuitableProjects(studentId);

      const randomAllocation = projects.at(getRandomInt(projects.length - 1));
      if (!randomAllocation) throw new Error("No suitable projects found");

      const student = await instance.getStudent(studentId);
      await student.allocateRandomProject(randomAllocation.id);
    }),

  allocateRandomProjectsToAll: procedure.instance.subGroupAdmin.mutation(
    async ({ ctx: { instance } }) => {
      const { selectedAlgConfigId: selectedAlgName } = await instance.get();
      if (!selectedAlgName) return;

      const unallocatedStudents = await instance.getUnallocatedStudents();

      const allocatedProjectIds = new Set<string>();

      for (const { id: studentId } of unallocatedStudents) {
        const projects = await instance.getStudentSuitableProjects(studentId);
        const projectIds = projects.map((p) => p.id);

        let { item, remaining } = fetchRandomItemFromArray(projectIds);
        while (allocatedProjectIds.has(item)) {
          ({ item, remaining } = fetchRandomItemFromArray(remaining));
        }
        allocatedProjectIds.add(item);
        if (!item) throw new Error("No suitable projects found");

        const student = await instance.getStudent(studentId);
        await student.allocateRandomProject(item);
      }
    },
  ),

  removeAllocation: procedure.instance.subGroupAdmin
    .input(z.object({ studentId: z.string() }))
    .output(z.void())
    .mutation(
      async ({ ctx: { instance }, input: { studentId } }) =>
        await instance.deleteStudentAllocation(studentId),
    ),
});
