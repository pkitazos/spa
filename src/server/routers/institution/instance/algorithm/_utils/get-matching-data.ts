import { AllocationInstance, PrismaClient } from "@prisma/client";

import { getSupervisorPreAllocatedProjects } from "@/db/transactions/supervisor-pre-allocations";

export async function getMatchingData(
  db: PrismaClient,
  allocationInstance: AllocationInstance,
) {
  const {
    allocationGroupId: group,
    allocationSubGroupId: subGroup,
    id: instance,
    minPreferences,
    maxPreferences,
  } = allocationInstance;

  return await db.$transaction(async (tx) => {
    const preAllocations = await getSupervisorPreAllocatedProjects(tx, {
      group,
      subGroup,
      instance,
    });

    const students = await tx.studentDetails
      .findMany({
        where: {
          allocationGroupId: group,
          allocationSubGroupId: subGroup,
          allocationInstanceId: instance,
          submittedPreferences: true,
          userInInstance: { studentAllocation: { is: null } },
        },
        select: {
          userId: true,
          preferences: {
            select: {
              project: { select: { id: true, supervisorId: true } },
              rank: true,
            },
            orderBy: { rank: "asc" },
          },
        },
      })
      .then((data) =>
        data
          .filter((s) => {
            return (
              s.preferences.length >= minPreferences &&
              s.preferences.length <= maxPreferences
            );
          })
          .map((s) => ({
            id: s.userId,
            preferences: s.preferences.map(({ project }) => project.id),
          })),
      );

    const supervisors = await tx.supervisorInstanceDetails
      .findMany({
        where: {
          allocationGroupId: group,
          allocationSubGroupId: subGroup,
          allocationInstanceId: instance,
        },
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

    const projects = await tx.project
      .findMany({
        where: {
          allocationGroupId: group,
          allocationSubGroupId: subGroup,
          allocationInstanceId: instance,
          preAllocatedStudentId: null,
        },
        select: {
          id: true,
          supervisorId: true,
          capacityLowerBound: true,
          capacityUpperBound: true,
        },
      })
      .then((data) =>
        data.map((p) => ({
          id: p.id,
          lowerBound: p.capacityLowerBound,
          upperBound: p.capacityUpperBound,
          supervisorId: p.supervisorId,
        })),
      );

    return { students, projects, supervisors };
  });
}
