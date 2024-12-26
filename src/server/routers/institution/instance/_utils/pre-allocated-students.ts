import { PrismaTransactionClient } from "@/db";
import { InstanceParams } from "@/lib/validations/params";

export async function getPreAllocatedStudents(
  db: PrismaTransactionClient,
  params: InstanceParams,
) {
  const projectData = await db.projectInInstance.findMany({
    where: {
      allocationGroupId: params.group,
      allocationSubGroupId: params.subGroup,
      allocationInstanceId: params.instance,
      details: { preAllocatedStudentId: { not: null } },
    },
    select: { details: { select: { preAllocatedStudentId: true } } },
  });

  return new Set(
    projectData
      .map((p) => p.details.preAllocatedStudentId)
      .filter((p) => p !== null),
  );
}
