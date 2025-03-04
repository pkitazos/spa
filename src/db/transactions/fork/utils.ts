import { PrismaTransactionClient } from "@/db";
import { expand } from "@/lib/utils/general/instance-params";
import { InstanceParams } from "@/lib/validations/params";

export function updateSupervisorCapacities(
  {
    projectAllocationTarget: target,
    projectAllocationUpperBound: upperBound,
  }: {
    projectAllocationTarget: number;
    projectAllocationUpperBound: number;
  },
  allocationCount: number,
) {
  return {
    projectAllocationLowerBound: 0,
    projectAllocationTarget: Math.max(target - allocationCount, 0),
    projectAllocationUpperBound: Math.max(upperBound - allocationCount, 0),
  };
}

export function updateProjectCapacities(
  upperBound: number,
  allocationCount: number,
) {
  return {
    capacityLowerBound: 0,
    capacityUpperBound: Math.max(upperBound - allocationCount, 0),
  };
}

export async function getSupervisorAllocations(
  tx: PrismaTransactionClient,
  params: InstanceParams,
) {
  return await tx.projectAllocation
    .findMany({
      where: expand(params),
      include: { project: { select: { supervisorId: true } } },
    })
    .then((data) =>
      data.reduce(
        (acc, { project: val }) => {
          acc[val.supervisorId] = (acc[val.supervisorId] ?? 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      ),
    );
}

export async function getProjectAllocationCount(
  tx: PrismaTransactionClient,
  params: InstanceParams,
) {
  return await tx.projectAllocation
    .findMany({ where: expand(params), select: { projectId: true } })
    .then((data) =>
      data.reduce(
        (acc, val) => {
          acc[val.projectId] = (acc[val.projectId] ?? 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      ),
    );
}
