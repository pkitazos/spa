import { clamp } from "@/lib/utils/general/clamp";

/**
 *
 * @param supervisorProjectAllocationTarget the number of students a supervisor wishes to supervise
 * @param supervisorAllocatedProjectCount the number of projects by a supervisor that have been allocated
 * @returns the number of projects a supervisor must submit
 */
export function computeProjectSubmissionTarget(
  supervisorProjectAllocationTarget: number,
  supervisorAllocatedProjectCount: number,
) {
  const projectSubmissionTarget =
    2 * (supervisorProjectAllocationTarget - supervisorAllocatedProjectCount);

  return clamp(projectSubmissionTarget, [0, 12]);
}
