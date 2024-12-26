import { PrismaClient } from "@prisma/client";

import { expand } from "@/lib/utils/general/instance-params";
import { InstanceParams } from "@/lib/validations/params";

export async function removeStudentsTx(
  db: PrismaClient,
  studentIds: string[],
  params: InstanceParams,
) {
  await db.$transaction(async (tx) => {
    const projects = await tx.projectInInstance.findMany({
      where: {
        ...expand(params),
        details: { preAllocatedStudentId: { in: studentIds } },
      },
    });

    if (projects.length > 0) {
      await tx.projectDetails.updateMany({
        where: { id: { in: projects.map((p) => p.projectId) } },
        data: { preAllocatedStudentId: null },
      });
    }

    await tx.userInInstance.deleteMany({
      where: { ...expand(params), userId: { in: studentIds } },
    });
  });
}
