import { PrismaClient } from "@prisma/client";

import { expand } from "@/lib/utils/general/instance-params";
import { InstanceParams } from "@/lib/validations/params";

export async function removeStudentTx(
  db: PrismaClient,
  studentId: string,
  params: InstanceParams,
) {
  await db.$transaction(async (tx) => {
    const project = await tx.projectInInstance.findFirst({
      where: {
        ...expand(params),
        details: { preAllocatedStudentId: studentId },
      },
    });

    if (project) {
      await tx.projectDetails.update({
        where: { id: project.projectId },
        data: { preAllocatedStudentId: null },
      });
    }

    await tx.userInInstance.delete({
      where: {
        instanceMembership: { ...expand(params), userId: studentId },
      },
    });
  });
}
