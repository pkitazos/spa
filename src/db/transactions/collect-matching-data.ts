import { expand } from "@/lib/utils/general/instance-params";

import { Transformers as T } from "../transformers";
import { DB } from "@/db/types";
import { InstanceDTO } from "@/dto";
import {
  adjustTarget,
  adjustUpperBound,
} from "@/lib/utils/algorithm/modifiers";

export async function collectMatchingData(db: DB, instanceData: InstanceDTO) {
  if (!instanceData.selectedAlgConfigId) {
    throw new Error("No algorithm selected");
  }

  const { maxRank, targetModifier, upperBoundModifier } = await db.algorithm
    .findFirstOrThrow({ where: { id: instanceData.selectedAlgConfigId } })
    .then(T.toAlgorithmDTO);

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
        studentSubmittedPreferences: {
          include: { project: true },
          orderBy: { rank: "asc" },
        },
      },
    })
    .then((data) =>
      data
        .filter((s) => {
          return (
            s.studentSubmittedPreferences.length >=
              instanceData.minStudentPreferences &&
            s.studentSubmittedPreferences.length <=
              instanceData.maxStudentPreferences
          );
        })
        .map((s) => ({
          id: s.userId,
          preferences: s.studentSubmittedPreferences.map(
            ({ project }) => project.id,
          ),
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
