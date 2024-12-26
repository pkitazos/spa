import { PrismaTransactionClient } from "@/db";
import { InstanceParams } from "@/lib/validations/params";

export async function getStudent(
  db: PrismaTransactionClient,
  params: InstanceParams,
  studentId: string,
) {
  const s = await db.studentDetails.findFirstOrThrow({
    where: {
      allocationGroupId: params.group,
      allocationSubGroupId: params.subGroup,
      allocationInstanceId: params.instance,
      userId: studentId,
    },
    select: {
      userInInstance: { select: { user: true } },
      studentLevel: true,
      latestSubmissionDateTime: true,
      submittedPreferences: true,
    },
  });

  return {
    id: s.userInInstance.user.id,
    name: s.userInInstance.user.name,
    email: s.userInInstance.user.email,
    studentLevel: s.studentLevel,
    latestSubmissionDateTime: s.latestSubmissionDateTime,
    submittedPreferences: s.submittedPreferences,
  };
}
