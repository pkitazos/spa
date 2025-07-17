import { z } from "zod";

import { procedure } from "@/server/middleware";
import { createTRPCRouter } from "@/server/trpc";

import { studentPreferenceSubmissionDto } from "@/lib/validations/dto/preference";
import { instanceParamsSchema } from "@/lib/validations/params";

import {
  csvDataSchema,
  generateProjectAggregated,
  generateProjectNormalised,
  generateSupervisorAggregated,
  generateSupervisorNormalised,
  generateTagAggregated,
  generateTagNormalised,
} from "./_utils/generate-csv-data";

export const preferenceRouter = createTRPCRouter({
  studentSubmissions: procedure.instance.subGroupAdmin
    .output(
      z.object({
        all: z.array(studentPreferenceSubmissionDto),
        incomplete: z.array(studentPreferenceSubmissionDto),
        preAllocated: z.array(studentPreferenceSubmissionDto),
      }),
    )
    .query(async ({ ctx: { instance } }) => {
      const preAllocatedStudentIds = await instance.getPreAllocatedStudentIds();

      const students = await instance
        .getStudentPreferenceDetails()
        .then((students) =>
          students.map((s) => ({
            id: s.institutionId,
            name: s.fullName,
            email: s.email,
            level: s.level,
            submissionCount: s.submittedPreferences.length,
            submitted: s.submittedPreferences.length !== 0,
            preAllocated: preAllocatedStudentIds.has(s.institutionId),
          })),
        );

      return {
        all: students,
        incomplete: students.filter((s) => !s.submitted && !s.preAllocated),
        preAllocated: students.filter((s) => s.preAllocated),
      };
    }),

  statsByProject: procedure.instance.subGroupAdmin
    .output(z.object({ aggregated: csvDataSchema, normalised: csvDataSchema }))
    .query(async ({ ctx: { instance } }) => {
      const preferences = await instance
        .getSubmittedPreferences()
        .then((data) =>
          data.map((p) => ({
            userId: p.studentId,
            projectId: p.project.id,
            rank: p.rank,
          })),
        );

      return {
        aggregated: generateProjectAggregated(preferences),
        normalised: generateProjectNormalised(preferences),
      };
    }),

  statsBySupervisor: procedure.instance.subGroupAdmin
    .output(z.object({ aggregated: csvDataSchema, normalised: csvDataSchema }))
    .query(async ({ ctx: { instance } }) => {
      const preferences = await instance
        .getSubmittedPreferences()
        .then((data) =>
          data
            .toSorted((a, b) => a.supervisorId.localeCompare(b.supervisorId))
            .map((p) => ({
              supervisorId: p.supervisorId,
              userId: p.studentId,
              projectId: p.project.id,
              rank: p.rank,
            })),
        );

      return {
        aggregated: generateSupervisorAggregated(preferences),
        normalised: generateSupervisorNormalised(preferences),
      };
    }),

  statsByTag: procedure.instance.subGroupAdmin
    .input(z.object({ params: instanceParamsSchema }))
    .query(async ({ ctx: { instance } }) => {
      const preferences = await instance
        .getSubmittedPreferences()
        .then((data) =>
          data.flatMap((p) =>
            p.tags.map((t) => ({
              tag: t.title,
              userId: p.studentId,
              projectId: p.project.id,
              rank: p.rank,
            })),
          ),
        );

      return {
        aggregated: generateTagAggregated(preferences),
        normalised: generateTagNormalised(preferences),
      };
    }),
});
