import { TX } from "@/db/types";
import { expand } from "@/lib/utils/general/instance-params";
import { InstanceParams } from "@/lib/validations/params";

export async function mark(
  tx: TX,
  params: InstanceParams,
  supervisorCounts: Record<string, number>,
  projectCounts: Record<string, number>,
) {
  const students = await getAvailableStudents(tx, params);
  const { supervisors, projects } = await getSupervisorsWithSlack(
    tx,
    params,
    supervisorCounts,
    projectCounts,
  );

  return { supervisors, projects, students };
}

export type ForkMarkedData = Awaited<ReturnType<typeof mark>>;

export type ForkMarkedStudentDto = ForkMarkedData["students"][number];

export type ForkMarkedSupervisorDto = ForkMarkedData["supervisors"][number];

export type ForkMarkedProjectDto = ForkMarkedData["projects"][number];

/**
 * Get supervisors who still have not reached their capacity
 * @param tx
 * @param params
 * @returns
 */
async function getSupervisorsWithSlack(
  tx: TX,
  params: InstanceParams,
  supervisorCounts: Record<string, number>,
  projectCounts: Record<string, number>,
) {
  const supervisorData = await tx.supervisorDetails.findMany({
    where: expand(params),
    include: {
      projects: { include: { flagsOnProject: true, tagsOnProject: true } },
    },
  });

  const supervisors = supervisorData
    .filter(
      (s) => s.projectAllocationUpperBound > (supervisorCounts[s.userId] ?? 0),
    )
    .map((s) => ({
      userId: s.userId,
      projectAllocationTarget: s.projectAllocationTarget,
      projectAllocationUpperBound: s.projectAllocationUpperBound,
      projectIds: s.projects.filter(
        (p) => p.capacityUpperBound > (projectCounts[p.id] ?? 0),
      ),
    }));

  return { supervisors, projects: supervisors.flatMap((s) => s.projectIds) };
}
/**
 * Get students with no allocation and their preferences (unconditionally)
 * @param tx
 * @param params
 * @returns
 */

async function getAvailableStudents(tx: TX, params: InstanceParams) {
  return await tx.studentDetails.findMany({
    where: { ...expand(params), projectAllocation: { is: null } },
    select: { userId: true, studentLevel: true },
  });
}
