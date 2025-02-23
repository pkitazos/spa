import { PrismaClient } from "@prisma/client";
import { TRPCClientError } from "@trpc/client";

import { expand } from "@/lib/utils/general/instance-params";
import { NewSupervisor } from "@/lib/validations/add-users/new-user";
import { InstanceParams } from "@/lib/validations/params";

export async function addSupervisorTx(
  db: PrismaClient,
  {
    institutionId,
    fullName,
    email,
    projectTarget,
    projectUpperQuota,
  }: NewSupervisor,
  params: InstanceParams,
) {
  return await db.$transaction(async (tx) => {
    const exists = await tx.supervisorDetails.findFirst({
      where: { ...expand(params), userId: institutionId },
    });
    if (exists) throw new TRPCClientError("User is already a supervisor");

    await tx.userInInstance.create({
      data: { ...expand(params), userId: institutionId },
    });

    await tx.supervisorDetails.create({
      data: {
        ...expand(params),
        userId: institutionId,
        projectAllocationLowerBound: 0,
        projectAllocationTarget: projectTarget,
        projectAllocationUpperBound: projectUpperQuota,
      },
    });

    return { institutionId, fullName, email, projectTarget, projectUpperQuota };
  });
}
