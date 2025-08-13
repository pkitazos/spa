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
    .mutation(async ({ ctx: { instance, audit }, input: { algId } }) => {
      audit("Set selected algorithm", { algId });
      return await instance.selectAlg(algId);
    }),

  clearSelection: procedure.instance.subGroupAdmin
    .input(z.object({ params: instanceParamsSchema }))
    .output(z.void())
    .mutation(async ({ ctx: { instance, audit } }) => {
      audit("Cleared algorithm selection");
      await instance.clearAlgSelection();
    }),

  clearAll: procedure.instance.subGroupAdmin
    .output(z.void())
    .mutation(async ({ ctx: { instance, audit } }) => {
      audit("Cleared algorithm results");
      await instance.clearAllAlgResults();
    }),

  exportCsvData: procedure.instance.subGroupAdmin
    .output(z.array(allocationCsvDataSchema))
    .query(async ({ ctx: { instance } }) => {
      const allocationData = await instance.getAllocationData();
      return allocationData.toExportData();
    }),

  allocateRandomProjectToStudent: procedure.instance.subGroupAdmin
    .input(z.object({ studentId: z.string() }))
    .output(z.void())
    .mutation(async ({ ctx: { instance, audit }, input: { studentId } }) => {
      audit("Randomly allocating project to student", { studentId });
      const projects = await instance.getStudentSuitableProjects(studentId);

      const randomAllocation = projects.at(getRandomInt(projects.length - 1));
      if (!randomAllocation) throw new Error("No suitable projects found");

      const student = await instance.getStudent(studentId);
      await student.allocateRandomProject(randomAllocation.id);
    }),

  allocateRandomProjectsToAll: procedure.instance.subGroupAdmin.mutation(
    async ({ ctx: { instance, audit } }) => {
      const { selectedAlgConfigId: selectedAlgName } = await instance.get();
      if (!selectedAlgName) return;

      const unallocatedStudents = await instance.getUnallocatedStudents();

      const allocatedProjectIds = new Set<string>();

      audit("Allocating random projects to students", {
        studentIds: unallocatedStudents.map((x) => x.id),
      });

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
    .mutation(async ({ ctx: { instance, audit }, input: { studentId } }) => {
      audit("Deleted allocation for student", { studentId });
      await instance.deleteStudentAllocation(studentId);
    }),
});
