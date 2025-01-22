import { User } from "@/lib/validations/auth";
import { InstanceParams } from "@/lib/validations/params";

import { Role, SystemRole } from "@/db";
import { DB } from "@/db/types";

export async function getSelfDefinedProject(
  db: DB,
  params: InstanceParams,
  studentId: string,
) {
  return await db.projectInInstance.findFirst({
    where: {
      allocationGroupId: params.group,
      allocationSubGroupId: params.subGroup,
      allocationInstanceId: params.instance,
      details: { preAllocatedStudentId: studentId },
    },
    include: { details: true },
  });
}

export async function hasSelfDefinedProject(
  db: DB,
  params: InstanceParams,
  user: User,
  roles: Set<SystemRole>,
) {
  if (!roles.has(Role.STUDENT)) return false;
  const studentId = user.id;
  return !!(await getSelfDefinedProject(db, params, studentId));
}
