import { PrismaTransactionClient } from "@/db";
import { expand } from "@/lib/utils/general/instance-params";
import { InstanceParams } from "@/lib/validations/params";

export async function updateAllocation(
  tx: PrismaTransactionClient,
  params: InstanceParams,
  studentId: string,
) {
  const currentAllocation = await tx.projectAllocation.findFirst({
    where: { userId: studentId },
  });

  if (currentAllocation) {
    await tx.projectAllocation.delete({
      where: {
        allocationId: {
          ...expand(params),
          projectId: currentAllocation.projectId,
          userId: studentId,
        },
      },
    });
  }
}
