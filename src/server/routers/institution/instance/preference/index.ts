import AdmZip from "adm-zip";
import { unparse } from "papaparse";
import { z } from "zod";

import { expand } from "@/lib/utils/general/instance-params";
import { instanceParamsSchema } from "@/lib/validations/params";

import { createTRPCRouter, instanceAdminProcedure } from "@/server/trpc";

import {
  generateProjectAggregated,
  generateProjectNormalised,
  generateSupervisorAggregated,
  generateSupervisorNormalised,
  generateTagAggregated,
  generateTagNormalised,
} from "./_utils/generate-csv-data";

import { getPreAllocatedStudents } from "@/db/transactions/pre-allocated-students";

export const preferenceRouter = createTRPCRouter({
  studentSubmissions: instanceAdminProcedure
    .input(z.object({ params: instanceParamsSchema }))
    .query(
      async ({
        ctx,
        input: {
          params: { group, subGroup, instance },
        },
      }) => {
        const preAllocatedStudents = await getPreAllocatedStudents(ctx.db, {
          group,
          subGroup,
          instance,
        });

        const students = await ctx.db.studentDetails
          .findMany({
            where: {
              allocationGroupId: group,
              allocationSubGroupId: subGroup,
              allocationInstanceId: instance,
            },
            select: {
              submittedPreferences: true,
              preferences: true,
              studentLevel: true,
              userInInstance: {
                select: {
                  user: { select: { id: true, name: true, email: true } },
                },
              },
            },
          })
          .then((data) =>
            data.map(({ userInInstance, ...s }) => ({
              ...userInInstance.user,
              level: s.studentLevel,
              submissionCount: s.preferences.length,
              submitted: s.submittedPreferences,
              preAllocated: preAllocatedStudents.has(userInInstance.user.id),
            })),
          );

        return {
          all: students,
          incomplete: students.filter((s) => !s.submitted && !s.preAllocated),
          preAllocated: students.filter((s) => s.preAllocated),
        };
      },
    ),

  statsByProject: instanceAdminProcedure
    .input(z.object({ params: instanceParamsSchema }))
    .query(async ({ ctx, input: { params } }) => {
      const preferences = await ctx.db.savedPreference.findMany({
        where: { ...expand(params) },
        select: { projectId: true, userId: true, rank: true },
        orderBy: [{ projectId: "asc" }, { rank: "asc" }, { userId: "asc" }],
      });

      return {
        aggregated: generateProjectAggregated(preferences),
        normalised: generateProjectNormalised(preferences),
      };
    }),

  statsBySupervisor: instanceAdminProcedure
    .input(z.object({ params: instanceParamsSchema }))
    .query(async ({ ctx, input: { params } }) => {
      const preferenceData = await ctx.db.savedPreference.findMany({
        where: { ...expand(params) },
        select: {
          projectId: true,
          userId: true,
          rank: true,
          project: { select: { supervisorId: true } },
        },
        orderBy: [
          { project: { supervisorId: "asc" } },
          { projectId: "asc" },
          { rank: "asc" },
          { userId: "asc" },
        ],
      });

      const preferences = preferenceData.map(
        ({ project: { supervisorId }, ...p }) => ({ ...p, supervisorId }),
      );

      return {
        aggregated: generateSupervisorAggregated(preferences),
        normalised: generateSupervisorNormalised(preferences),
      };
    }),

  statsByTag: instanceAdminProcedure
    .input(z.object({ params: instanceParamsSchema }))
    .query(async ({ ctx, input: { params } }) => {
      const preferenceData = await ctx.db.savedPreference.findMany({
        where: { ...expand(params) },
        select: {
          projectId: true,
          userId: true,
          rank: true,
          project: { select: { tagOnProject: { select: { tag: true } } } },
        },
        orderBy: [{ projectId: "asc" }, { rank: "asc" }, { userId: "asc" }],
      });

      const preferences = preferenceData.flatMap((p) =>
        p.project.tagOnProject.map((t) => ({
          tag: t.tag.title,
          projectId: p.projectId,
          userId: p.userId,
          rank: p.rank,
        })),
      );

      return {
        aggregated: generateTagAggregated(preferences),
        normalised: generateTagNormalised(preferences),
      };
    }),

  allStats: instanceAdminProcedure
    .input(z.object({ params: instanceParamsSchema }))
    .query(async ({ ctx, input: { params } }) => {
      const preferenceData = await ctx.db.savedPreference.findMany({
        where: { ...expand(params) },
        select: {
          projectId: true,
          userId: true,
          rank: true,
          project: {
            select: {
              supervisorId: true,
              tagOnProject: { select: { tag: true } },
            },
          },
        },
        orderBy: [
          { project: { supervisorId: "asc" } },
          { projectId: "asc" },
          { rank: "asc" },
          { userId: "asc" },
        ],
      });

      const preferences = preferenceData.flatMap((p) =>
        p.project.tagOnProject.map((t) => ({
          tag: t.tag.title,
          supervisorId: p.project.supervisorId,
          projectId: p.projectId,
          userId: p.userId,
          rank: p.rank,
        })),
      );

      const zip = new AdmZip();

      const handlers = [
        { name: "project-aggregated", fn: generateProjectAggregated },
        { name: "project-normalised", fn: generateProjectNormalised },
        { name: "supervisor-aggregated", fn: generateSupervisorAggregated },
        { name: "supervisor-normalised", fn: generateSupervisorNormalised },
        { name: "tag-aggregated", fn: generateTagAggregated },
        { name: "tag-normalised", fn: generateTagNormalised },
      ];

      handlers.forEach(({ name, fn }) => {
        const { header, rows } = fn(preferences);
        const csvContent = unparse({ fields: header, data: rows });
        zip.addFile(`by-${name}.csv`, Buffer.from(csvContent, "utf-8")); // change depending on the zip thing
      });

      const zipBuffer = zip.toBuffer();

      return {
        zipData: zipBuffer,
        filename: "all-preference-statistics.zip",
        contentType: "application/zip",
      };
    }),
});
