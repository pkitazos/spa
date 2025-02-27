import { AlgorithmDTO } from "@/lib/validations/algorithm";
import { MatchingDataDTO } from "@/lib/validations/matching";

// TODO: add docs + figure out where this was used
export function applyModifiers(
  { students, supervisors, projects }: MatchingDataDTO,
  { maxRank, targetModifier, upperBoundModifier }: AlgorithmDTO,
) {
  return {
    projects,

    students: students.map(({ preferences, ...rest }) => ({
      ...rest,
      preferences: preferences.slice(
        0,
        maxRank === -1 ? preferences.length : maxRank,
      ),
    })),

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

export function adjustTarget(unstableTarget: number, targetModifier: number) {
  return Math.max(unstableTarget + targetModifier, 0);
}

export function adjustUpperBound(
  unstableUpperBound: number,
  upperBoundModifier: number,
) {
  return Math.max(unstableUpperBound + upperBoundModifier, 0);
}
