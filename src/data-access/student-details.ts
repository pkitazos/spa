import { PrismaClient } from "@prisma/client";

import { expand } from "@/lib/utils/general/instance-params";
import { InstanceParams } from "@/lib/validations/params";

export async function getStudentDetailsWithUser(
  db: PrismaClient,
  params: InstanceParams,
) {
  return await db.studentDetails.findMany({
    where: expand(params),
    include: { userInInstance: { include: { user: true } } },
  });
}

export type StudentDetailsWithUser = Awaited<
  ReturnType<typeof getStudentDetailsWithUser>
>;
