import { Role } from "@prisma/client";
import { z } from "zod";

import { expand } from "@/lib/utils/general/instance-params";
import {
  AlgorithmResultDto,
  algorithmSchema,
  builtInAlgSchema,
} from "@/lib/validations/algorithm";
import {
  blankResult,
  MatchingDetailsDto,
  matchingResultSchema,
  SupervisorMatchingDetailsDto,
} from "@/lib/validations/matching";
import { instanceParamsSchema } from "@/lib/validations/params";

import { procedure } from "@/server/middleware";
import { createTRPCRouter, instanceAdminProcedure } from "@/server/trpc";

import { applyModifiers } from "./_utils/apply-modifiers";
import { executeMatchingAlgorithm } from "./_utils/execute-matching-algorithm";
import {
  extractMatchingDetails,
  parseMatchingResult,
} from "./_utils/extract-matching-details";
import { getAlgorithmsInOrder } from "./_utils/get-algorithms-in-order";
import { getBuiltInAlgorithm } from "./_utils/get-built-in-algorithm";
import { getMatchingData } from "./_utils/get-matching-data";

import { getSupervisorPreAllocatedProjects } from "@/db/transactions/supervisor-pre-allocations";

export const algorithmRouter = createTRPCRouter({
  run: procedure.instance.subGroupAdmin
    .input(z.object({ algorithm: algorithmSchema }))
    .output(
      z.object({ totalStudents: z.number(), matchedStudents: z.number() }),
    )
    .mutation(async ({ ctx: { instance, db }, input: { algorithm } }) => {
      const matchingData = await getMatchingData(db, ctx.instance).then(
        (data) => applyModifiers(data, algorithm),
      );

      const matchingResults = await executeMatchingAlgorithm({
        algorithm,
        matchingData,
      });

      const builtInAlg = getBuiltInAlgorithm(algorithm.algName);

      if (builtInAlg) {
        await ctx.db.algorithm.upsert({
          where: {
            algorithmId: {
              algName: algorithm.algName,
              allocationGroupId: group,
              allocationSubGroupId: subGroup,
              allocationInstanceId: instance,
            },
          },
          update: { matchingResultData: JSON.stringify(matchingResults) },
          create: {
            ...builtInAlg,
            allocationGroupId: group,
            allocationSubGroupId: subGroup,
            allocationInstanceId: instance,
            matchingResultData: JSON.stringify(matchingResults),
          },
        });
      } else {
        await ctx.db.algorithm.update({
          where: {
            algorithmId: {
              algName: algorithm.algName,
              allocationGroupId: group,
              allocationSubGroupId: subGroup,
              allocationInstanceId: instance,
            },
          },
          data: { matchingResultData: JSON.stringify(matchingResults) },
        });
      }

      return {
        totalStudents: matchingData.students.length,
        matchedStudents: matchingResults.size,
      };
    }),

  // BREAKING return type is now set
  takenNames: procedure.instance.subGroupAdmin
    .output(z.set(z.string()))
    .query(async ({ ctx: { instance } }) => {
      const takenNames = await instance.getAlgorithms();

      return new Set(
        takenNames.map(({ algorithmConfig: { algName } }) => algName),
      );
    }),

  create: procedure.instance.subGroupAdmin
    .input(z.object({ data: algorithmSchema }))
    .output(z.void())
    .mutation(async ({ ctx, input: { params, data } }) => {
      await ctx.db.algorithmConfig.create({
        data: {
          ...data,
          algorithmInInstances: {
            create: { ...expand(params), matchingResultId: "// TODO" },
          },
        },
      });
    }),

  // TODO review?
  delete: procedure.instance.subGroupAdmin
    .input(z.object({ algId: z.string() }))
    .mutation(async ({ ctx, input: { algId: id } }) => {
      await ctx.db.algorithmConfig.delete({ where: { id } });
    }),

  getAll: procedure.instance.subGroupAdmin
    .input(z.object({ params: instanceParamsSchema }))
    .query(
      async ({
        ctx,
        input: {
          params: { group, subGroup, instance },
        },
      }) => {
        const customAlgorithms = await ctx.db.algorithm.findMany({
          where: {
            allocationGroupId: group,
            allocationSubGroupId: subGroup,
            allocationInstanceId: instance,
            NOT: builtInAlgSchema.options.map((algName) => ({ algName })),
          },
        });

        const allAlgorithms = getAlgorithmsInOrder(customAlgorithms);

        return allAlgorithms.map((a) => ({
          algName: a.algName,
          displayName: a.displayName,
          description: a.description ?? "",
          targetModifier: a.targetModifier,
          upperBoundModifier: a.upperBoundModifier,
          maxRank: a.maxRank,
          flags: [a.flag1, a.flag2, a.flag3].filter((f) => f !== null),
        }));
      },
    ),

  getAllSummaryResults: instanceAdminProcedure
    .input(z.object({ params: instanceParamsSchema }))
    .query(
      async ({
        ctx,
        input: {
          params: { group, subGroup, instance },
        },
      }) => {
        const algorithmData = await ctx.db.algorithm.findMany({
          where: {
            allocationGroupId: group,
            allocationSubGroupId: subGroup,
            allocationInstanceId: instance,
          },
          select: {
            algName: true,
            displayName: true,
            matchingResultData: true,
          },
          orderBy: { algName: "asc" },
        });

        const resultsByAlgName = new Map<string, AlgorithmResultDto>();

        for (const {
          algName,
          displayName,
          matchingResultData: data,
        } of algorithmData) {
          const { weight, size, profile, cost } = parseMatchingResult(data);
          const dto = { algName, displayName, weight, size, profile, cost };
          resultsByAlgName.set(algName, dto);
        }

        const algs = getAlgorithmsInOrder(algorithmData);
        return algs.map((a) => resultsByAlgName.get(a.algName)!);
      },
    ),

  singleResult: instanceAdminProcedure
    .input(z.object({ params: instanceParamsSchema, algName: z.string() }))
    .query(
      async ({
        ctx,
        input: {
          algName,
          params: { group, subGroup, instance },
        },
      }) => {
        const res = await ctx.db.algorithm.findFirst({
          where: {
            algName,
            allocationGroupId: group,
            allocationSubGroupId: subGroup,
            allocationInstanceId: instance,
          },
          select: { matchingResultData: true },
        });

        if (!res) return blankResult;

        const result = matchingResultSchema.safeParse(
          JSON.parse(res.matchingResultData as string),
        );

        if (!result.success) return blankResult;

        return result.data;
      },
    ),

  allStudentResults: instanceAdminProcedure
    .input(z.object({ params: instanceParamsSchema }))
    .query(
      async ({
        ctx,
        input: {
          params: { group, subGroup, instance },
        },
      }) => {
        const algorithmData = await ctx.db.algorithm.findMany({
          where: {
            allocationGroupId: group,
            allocationSubGroupId: subGroup,
            allocationInstanceId: instance,
          },
          select: {
            algName: true,
            displayName: true,
            matchingResultData: true,
          },
          orderBy: { algName: "asc" },
        });

        const { projects, users } =
          await ctx.db.allocationInstance.findFirstOrThrow({
            where: {
              allocationGroupId: group,
              allocationSubGroupId: subGroup,
              id: instance,
            },
            select: {
              projects: true,
              users: {
                where: { role: Role.STUDENT },
                select: { user: { select: { id: true, name: true } } },
              },
            },
          });

        const students = users.map((u) => u.user);

        const resultsByAlgName = new Map<string, MatchingDetailsDto[]>();

        for (const { algName, matchingResultData: data } of algorithmData) {
          const matching = parseMatchingResult(data).matching;

          const details = matching.map((m) =>
            extractMatchingDetails(
              students,
              projects,
              m.student_id,
              m.project_id,
              m.preference_rank,
            ),
          );

          resultsByAlgName.set(algName, details);
        }

        const allAlgorithms = getAlgorithmsInOrder(algorithmData);

        const results = allAlgorithms.map(({ algName, displayName }) => ({
          algName,
          displayName,
          data: resultsByAlgName.get(algName) ?? [],
        }));

        const firstNonEmptyIdx = results.findIndex((r) => r.data.length > 0);

        return {
          results,
          firstNonEmpty: results.at(firstNonEmptyIdx)?.algName,
        };
      },
    ),

  allSupervisorResults: instanceAdminProcedure
    .input(z.object({ params: instanceParamsSchema }))
    .query(
      async ({
        ctx,
        input: {
          params: { group, subGroup, instance },
        },
      }) => {
        const algorithmData = await ctx.db.algorithm.findMany({
          where: {
            allocationGroupId: group,
            allocationSubGroupId: subGroup,
            allocationInstanceId: instance,
          },
          select: {
            algName: true,
            displayName: true,
            matchingResultData: true,
          },
          orderBy: { algName: "asc" },
        });

        const supervisorPreAllocations =
          await getSupervisorPreAllocatedProjects(ctx.db, {
            group,
            subGroup,
            instance,
          });

        const supervisors = await ctx.db.supervisorInstanceDetails
          .findMany({
            where: {
              allocationGroupId: group,
              allocationSubGroupId: subGroup,
              allocationInstanceId: instance,
            },
            select: {
              projectAllocationTarget: true,
              projectAllocationUpperBound: true,
              userInInstance: {
                select: { user: { select: { id: true, name: true } } },
              },
            },
          })
          .then((data) =>
            data.map((s) => ({
              ...s.userInInstance.user,
              projectAllocationTarget: s.projectAllocationTarget,
              projectAllocationUpperBound: s.projectAllocationUpperBound,
              preAllocations:
                supervisorPreAllocations[s.userInInstance.user.id] ?? 0,
            })),
          );

        // TODO: refactor this to use a Record instead of a Map
        const resultsByAlgName = new Map<
          string,
          SupervisorMatchingDetailsDto[]
        >();

        // TODO: clean this whole thing up
        for (const { algName, matchingResultData: data } of algorithmData) {
          const matching = parseMatchingResult(data).matching;

          const details = matching.reduce(
            (acc, m) => {
              const supervisorDetails = supervisors.find(
                (s) => s.id === m.supervisor_id,
              );

              if (!supervisorDetails) {
                throw new Error(`Supervisor ${m.supervisor_id} not found`);
              }

              const algorithmAllocationCount =
                (acc[m.supervisor_id]?.allocationCount ?? 0) + 1;

              const trueCount =
                algorithmAllocationCount + supervisorDetails.preAllocations;

              acc[m.supervisor_id] = {
                supervisorId: m.supervisor_id,
                supervisorName: supervisorDetails.name,

                projectTarget: m.supervisor_capacities.target,
                actualTarget: supervisorDetails.projectAllocationTarget,

                projectUpperQuota: m.supervisor_capacities.upper_bound,
                actualUpperQuota: supervisorDetails.projectAllocationUpperBound,

                allocationCount: algorithmAllocationCount,
                preAllocatedCount: supervisorDetails.preAllocations,

                algorithmTargetDifference:
                  algorithmAllocationCount -
                  supervisorDetails.projectAllocationTarget,

                actualTargetDifference:
                  trueCount - supervisorDetails.projectAllocationTarget,
              };

              return acc;
            },
            {} as Record<string, SupervisorMatchingDetailsDto>,
          );

          resultsByAlgName.set(algName, Object.values(details));
        }

        const allAlgorithms = getAlgorithmsInOrder(algorithmData);

        const results = allAlgorithms.map(({ algName, displayName }) => ({
          algName,
          displayName,
          data: resultsByAlgName.get(algName) ?? [],
        }));

        const firstNonEmptyIdx = results.findIndex((r) => r.data.length > 0);

        return {
          results,
          firstNonEmpty: results.at(firstNonEmptyIdx)?.algName,
        };
      },
    ),
});
