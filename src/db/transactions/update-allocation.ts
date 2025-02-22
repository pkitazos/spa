import { expand } from "@/lib/utils/general/instance-params";
import { InstanceParams } from "@/lib/validations/params";

import { TX } from "@/db/types";

export async function updateAllocation(
  tx: TX,
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
