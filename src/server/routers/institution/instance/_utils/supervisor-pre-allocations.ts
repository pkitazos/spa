import { PrismaTransactionClient } from "@/db";
import { InstanceParams } from "@/lib/validations/params";

export async function getSupervisorPreAllocatedProjects(
  tx: PrismaTransactionClient,
  params: InstanceParams,
) {
  return await tx.project
    .findMany({
      where: {
        allocationGroupId: params.group,
        allocationSubGroupId: params.subGroup,
        allocationInstanceId: params.instance,
        preAllocatedStudentId: { not: null },
      },
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
}
