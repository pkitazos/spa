import { NewStudent } from "@/lib/validations/add-users/new-user";
import { InstanceParams } from "@/lib/validations/params";

import { checkUsersMembership } from "./check-users-membership";

import { DB, Role } from "@/db/types";

export async function addStudentsTx(
  db: DB,
  newStudents: NewStudent[],
  { group, subGroup, instance }: InstanceParams,
) {
  return await db.$transaction(async (tx) => {
    const studentData = await tx.studentDetails.findMany({
      where: {
        allocationGroupId: group,
        allocationSubGroupId: subGroup,
        allocationInstanceId: instance,
      },
      select: { userId: true },
    });

    const { validatedNewUsers, errors } = await checkUsersMembership(
      tx,
      newStudents,
      studentData.map((s) => s.userId),
    );

    await tx.userInInstance.createMany({
      data: validatedNewUsers.map(({ institutionId }) => ({
        allocationGroupId: group,
        allocationSubGroupId: subGroup,
        allocationInstanceId: instance,
        role: Role.STUDENT,
        userId: institutionId,
      })),
      skipDuplicates: true,
    });

    await tx.studentDetails.createMany({
      data: validatedNewUsers.map(({ level, institutionId }) => ({
        allocationGroupId: group,
        allocationSubGroupId: subGroup,
        allocationInstanceId: instance,
        userId: institutionId,
        studentLevel: level,
        submittedPreferences: false,
      })),
    });

    return {
      successFullyAdded: validatedNewUsers.length,
      errors: errors.map(([u, e]) => ({
        msg: e,
        user: u,
      })),
    };
  });
}
