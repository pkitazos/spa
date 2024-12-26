import { PrismaClient } from "@prisma/client";
import { TRPCClientError } from "@trpc/client";

import { expand } from "@/lib/utils/general/instance-params";
import { NewStudent } from "@/lib/validations/add-users/new-user";
import { InstanceParams } from "@/lib/validations/params";

import { validateEmailGUIDMatch } from "@/server/utils/id-email-check";

export async function addStudentTx(
  db: PrismaClient,
  { institutionId, fullName, email, level }: NewStudent,
  params: InstanceParams,
) {
  return await db.$transaction(async (tx) => {
    const exists = await tx.studentDetails.findFirst({
      where: { ...expand(params), userId: institutionId },
    });
    if (exists) throw new TRPCClientError("User is already a student");

    await validateEmailGUIDMatch(tx, institutionId, email, fullName);

    await tx.userInInstance.create({
      data: { ...expand(params), userId: institutionId },
    });

    await tx.studentDetails.create({
      data: { ...expand(params), userId: institutionId, studentLevel: level },
    });
    return { institutionId, fullName, email, level };
  });
}
