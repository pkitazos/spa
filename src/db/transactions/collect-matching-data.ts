import { type InstanceDTO } from "@/dto";

import { type MatchingAlgorithm } from "@/data-objects";

import { type DB } from "@/db/types";

import {
  adjustTarget,
  adjustUpperBound,
} from "@/lib/utils/algorithm/modifiers";
import { expand } from "@/lib/utils/general/instance-params";

import { Transformers as T } from "../transformers";

export async function collectMatchingData(
  db: DB,
  instanceData: InstanceDTO,
  algorithm: MatchingAlgorithm,
): Promise<{
  students: { id: string; preferences: string[] }[];
  projects: {
    id: string;
    lowerBound: number;
    upperBound: number;
    supervisorId: string;
  }[];
  supervisors: {
    id: string;
    lowerBound: number;
    target: number;
    upperBound: number;
  }[];
}> {
  const { maxRank, targetModifier, upperBoundModifier } = await db.algorithm
    .findFirstOrThrow({ where: { id: algorithm.params.algConfigId } })
    .then((x) => T.toAlgorithmDTO(x));

  const preAllocations = await db.project
    .findMany({
      where: { ...expand(instanceData), preAllocatedStudentId: { not: null } },
    })
    .then((data) =>
      data.reduce(
        (acc, val) => {
          acc[val.supervisorId] = (acc[val.supervisorId] ?? 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      ),
    );

  const students = await db.studentDetails
    .findMany({
      where: {
        ...expand(instanceData),
        latestSubmissionDateTime: { not: null },
        projectAllocation: { is: null },
      },
      include: {
        submittedPreferences: {
          include: { project: true },
          orderBy: { rank: "asc" },
        },
      },
    })
    .then((data) =>
      data
        .filter((s) => {
          return (
            s.submittedPreferences.length >=
              instanceData.minStudentPreferences &&
            s.submittedPreferences.length <= instanceData.maxStudentPreferences
          );
        })
        .map((s) => ({
          id: s.userId,
          preferences: s.submittedPreferences.map(({ project }) => project.id),
        })),
    );

  const supervisors = await db.supervisorDetails
    .findMany({
      where: expand(instanceData),
      select: {
        userId: true,
        projectAllocationLowerBound: true,
        projectAllocationTarget: true,
        projectAllocationUpperBound: true,
      },
    })
    .then((data) =>
      data.map((s) => ({
        id: s.userId,
        lowerBound: s.projectAllocationLowerBound,
        target: s.projectAllocationTarget - (preAllocations[s.userId] ?? 0),
        upperBound:
          s.projectAllocationUpperBound - (preAllocations[s.userId] ?? 0),
      })),
    );

  const projects = await db.project
    .findMany({ where: expand(instanceData) })
    .then((data) =>
      data.map((p) => ({
        id: p.id,
        lowerBound: p.capacityLowerBound,
        upperBound: p.capacityUpperBound,
        supervisorId: p.supervisorId,
      })),
    );

  return {
    students: students.map(({ preferences, ...rest }) => ({
      ...rest,
      preferences: preferences.slice(
        0,
        maxRank === -1 ? preferences.length : maxRank,
      ),
    })),
    projects,
    supervisors: supervisors.map(({ target, upperBound, ...rest }) => {
      const newTarget = adjustTarget(target, targetModifier);
      const newUpperBound = adjustUpperBound(upperBound, upperBoundModifier);

      return {
        ...rest,
        target: newTarget,
        upperBound: Math.max(newTarget, newUpperBound),
      };
    }),
  };
}
