import { compareAsc } from "date-fns";
import { z } from "zod";

import { expand } from "@/lib/utils/general/instance-params";
import { algorithmResultDtoSchema } from "@/lib/validations/algorithm";
import {
  blankResult,
  matchingResultDtoSchema,
  supervisorMatchingDetailsDtoSchema2,
} from "@/lib/validations/matching";
import { instanceParamsSchema } from "@/lib/validations/params";

import { procedure } from "@/server/middleware";
import { createTRPCRouter } from "@/server/trpc";

import { adjustTarget, adjustUpperBound } from "./_utils/apply-modifiers";
import { Transformers as T } from "@/db/transformers";
import {
  algorithmDtoSchema,
  projectDtoSchema,
  studentDtoSchema,
  userDtoSchema,
} from "@/dto";
import { AlgorithmRunResult } from "@/dto/algorithm-run-result";

export const algorithmRouter = createTRPCRouter({
  // BREAKING input/output type changed
  // pin
  run: procedure.instance.subGroupAdmin
    .input(z.object({ algConfigId: z.string() }))
    .output(z.object({ total: z.number(), matched: z.number() }))
    .mutation(async ({ ctx: { instance }, input: { algConfigId } }) => {
      const alg = instance.getAlgorithm(algConfigId); // ? this feels weird

      const matchingData = await instance.getMatchingData();
      const res = await alg.run(matchingData);

      if (res !== AlgorithmRunResult.OK) {
        // ? perhaps we should just propagate the error and handle it on the client
        throw new Error("Algorithm failed to run");
      }

      const matchingResults = await alg.getResults();

      return {
        total: matchingData.students.length,
        matched: matchingResults.matching.length,
      };
    }),

  // BREAKING return type is now set
  // ! same problem as with renaming allocation instances
  takenNames: procedure.instance.subGroupAdmin
    .output(z.set(z.string()))
    .query(async ({ ctx: { instance } }) => {
      const takenNames = await instance.getAllAlgorithms();
      return new Set(takenNames.map((a) => a.displayName));
    }),

  create: procedure.instance.subGroupAdmin
    .input(z.object({ data: algorithmDtoSchema }))
    .output(algorithmDtoSchema)
    .mutation(
      async ({ ctx: { instance }, input: { data } }) =>
        await instance.createAlgorithm(data),
    ),

  delete: procedure.instance.subGroupAdmin
    .input(z.object({ algId: z.string() }))
    .mutation(async ({ ctx, input: { algId: id } }) => {
      // instance.deleteAlgorithm
      await ctx.db.algorithmConfig.delete({ where: { id } });
    }),

  // BREAKING output type changed
  getAll: procedure.instance.subGroupAdmin
    .input(z.object({ params: instanceParamsSchema }))
    .output(z.array(algorithmDtoSchema))
    .query(async ({ ctx: { instance } }) => await instance.getAllAlgorithms()),

  // BREAKING output type changed
  // TODO: review how this is used on the client
  getAllSummaryResults: procedure.instance.subGroupAdmin
    .output(z.array(algorithmResultDtoSchema))
    .query(async ({ ctx: { db }, input: { params } }) => {
      // instance.getSummaryResults
      const algorithmData = await db.algorithmConfigInInstance.findMany({
        where: expand(params),
        include: {
          matchingResult: { include: { matching: true } },
          algorithmConfig: true,
        },
        orderBy: { algorithmConfig: { createdAt: "asc" } },
      });

      return algorithmData
        .filter((x) => x.matchingResult !== null)
        .map(({ algorithmConfig, matchingResult }) => ({
          algorithm: T.toAlgorithmDTO(algorithmConfig),
          matchingResults: matchingResult!,
        }))
        .sort((a, b) =>
          // todo remove this later
          compareAsc(a.algorithm.createdAt, b.algorithm.createdAt),
        );
    }),

  // BREAKING input/output type changed
  singleResult: procedure.instance.subGroupAdmin
    .input(z.object({ algConfigId: z.string() }))
    .output(matchingResultDtoSchema)
    .query(async ({ ctx: { instance, db }, input: { algConfigId } }) => {
      const res = await db.matchingResult.findFirst({
        where: { algConfigId, ...expand(instance.params) },
        include: { matching: true },
      });

      return !res ? blankResult : res;
    }),

  allStudentResults: procedure.instance.subGroupAdmin
    .output(
      z.object({
        firstNonEmpty: z.string().or(z.undefined()),
        results: z.array(
          z.object({
            algorithm: algorithmDtoSchema,
            matchingPairs: z.array(
              z.object({
                student: studentDtoSchema,
                project: projectDtoSchema,
                studentRanking: z.number(),
              }),
            ),
          }),
        ),
      }),
    )
    .query(async ({ ctx: { instance, db } }) => {
      // instance.getStudentResults
      const algorithmData = await db.algorithmConfigInInstance.findMany({
        where: expand(instance.params),
        include: {
          algorithmConfig: true,
          matchingResult: {
            include: {
              matching: {
                include: {
                  student: {
                    include: {
                      studentFlags: { include: { flag: true } },
                      userInInstance: { include: { user: true } },
                    },
                  },
                  project: {
                    include: {
                      details: {
                        include: {
                          flagsOnProject: { include: { flag: true } },
                          tagsOnProject: { include: { tag: true } },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { algorithmConfig: { createdAt: "asc" } },
      });

      const results = algorithmData
        .map((a) => ({
          algorithm: T.toAlgorithmDTO(a.algorithmConfig),
          matchingPairs:
            a.matchingResult?.matching.map((m) => ({
              project: T.toProjectDTO(m.project),
              student: T.toStudentDTO(m.student),
              studentRanking: m.studentRanking,
            })) ?? [],
        }))
        .sort((a, b) =>
          compareAsc(a.algorithm.createdAt, b.algorithm.createdAt),
        );

      const firstNonEmptyIdx = results.findIndex(
        (r) => r.matchingPairs.length > 0,
      );

      return {
        results,
        firstNonEmpty: results.at(firstNonEmptyIdx)?.algorithm.id,
      };
    }),

  // BREAKING output type changed
  allSupervisorResults: procedure.instance.subGroupAdmin
    .output(
      z.object({
        firstNonEmpty: z.string().or(z.undefined()),
        results: z.array(
          z.object({
            algorithm: algorithmDtoSchema,
            data: z.array(
              z.object({
                supervisor: userDtoSchema,
                matchingDetails: supervisorMatchingDetailsDtoSchema2,
              }),
            ),
          }),
        ),
      }),
    )
    .query(async ({ ctx: { instance, db } }) => {
      // instance.getSupervisorResults
      const algorithmData = await db.algorithmConfigInInstance.findMany({
        where: expand(instance.params),
        include: {
          algorithmConfig: true,
          matchingResult: {
            include: {
              matching: {
                include: {
                  student: true,
                  project: {
                    include: {
                      details: true,
                      supervisor: {
                        include: {
                          userInInstance: { include: { user: true } },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { algorithmConfig: { createdAt: "asc" } },
      });

      const preAllocationsMap = await instance.getSupervisorPreAllocations();

      const results = algorithmData
        .sort((a, b) =>
          compareAsc(a.algorithmConfig.createdAt, b.algorithmConfig.createdAt),
        )
        .map((x) => {
          const algorithm = T.toAlgorithmDTO(x.algorithmConfig);
          const matchingData = x.matchingResult?.matching ?? [];

          const algAllocationsMap = matchingData.reduce(
            (acc, { project }) => ({
              ...acc,
              [project.supervisorId]: (acc[project.supervisorId] ?? 0) + 1,
            }),
            {} as Record<string, number>,
          );

          const targetModifier = x.algorithmConfig.targetModifier;
          const upperBoundModifier = x.algorithmConfig.upperBoundModifier;

          return {
            algorithm,
            data: matchingData.map(({ project }) => {
              const s = T.toSupervisorDTO(project.supervisor);

              const preAllocationCount = preAllocationsMap[s.id] ?? 0;
              const algAllocationCount = algAllocationsMap[s.id] ?? 0;
              const totalCount = algAllocationCount + preAllocationCount;

              return {
                supervisor: s,
                matchingDetails: {
                  // the supervisor's target that was given to the algorithm
                  projectTarget: adjustTarget(
                    s.allocationTarget,
                    targetModifier,
                  ),

                  // the supervisor's target that setup in the allocation instance
                  actualTarget: s.allocationTarget,

                  // the supervisor's upper quota that was given to the algorithm
                  projectUpperQuota: adjustUpperBound(
                    s.allocationUpperBound,
                    upperBoundModifier,
                  ),

                  // the supervisor's upper quota that setup in the allocation instance
                  actualUpperQuota: s.allocationUpperBound,

                  // the number of students that were allocated to the supervisor by the algorithm
                  allocationCount: algAllocationCount,

                  // the number of students that were pre-allocated to the supervisor
                  preAllocatedCount: preAllocationCount,

                  // the difference between the number of students that were allocated to the supervisor by the algorithm and the supervisor's target in the allocation instance
                  algorithmTargetDifference:
                    algAllocationCount - s.allocationTarget,

                  // the difference between the number of students that were allocated to the supervisor in total and the supervisor's target in the allocation instance
                  actualTargetDifference: totalCount - s.allocationTarget,
                },
              };
            }),
          };
        });

      const firstNonEmptyIdx = results.findIndex((r) => r.data.length > 0);

      return {
        firstNonEmpty: results.at(firstNonEmptyIdx)?.algorithm.id,
        results,
      };
    }),
});
