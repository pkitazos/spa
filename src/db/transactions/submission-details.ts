import { PrismaClient } from "@prisma/client";

import { InstanceParams } from "@/lib/validations/params";
import { SupervisorProjectSubmissionDetails } from "@/lib/validations/supervisor-project-submission-details";

import { computeProjectSubmissionTarget } from "@/config/submission-target";

export async function computeSubmissionDetails(
  db: PrismaClient,
  params: InstanceParams,
): Promise<SupervisorProjectSubmissionDetails[]> {
  const data = await db.supervisorDetails.findMany({
    where: {
      allocationGroupId: params.group,
      allocationSubGroupId: params.subGroup,
      allocationInstanceId: params.instance,
    },
    select: {
      projectAllocationLowerBound: true,
      projectAllocationTarget: true,
      projectAllocationUpperBound: true,
      userInInstance: {
        select: {
          user: { select: { id: true, name: true, email: true } },
          supervisorProjects: { select: { allocations: true } },
        },
      },
    },
    orderBy: { userId: "asc" },
  });

  return data.map((s) => {
    const projectAllocationTarget = s.projectAllocationTarget;
    const allocatedCount = s.userInInstance.supervisorProjects
      .map((p) => p.allocations.length)
      .reduce((a, b) => a + b, 0);
    const submittedProjectsCount = s.userInInstance.supervisorProjects.length;

    return {
      userId: s.userInInstance.user.id,
      name: s.userInInstance.user.name!,
      email: s.userInInstance.user.email!,
      projectAllocationTarget,
      allocatedCount,
      submittedProjectsCount,
      submissionTarget: computeProjectSubmissionTarget(
        projectAllocationTarget,
        allocatedCount,
      ),
    };
  });
}
