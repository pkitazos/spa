import { PrismaClient } from "@prisma/client";

import { NewSupervisor } from "@/lib/validations/add-users/new-user";
import { InstanceParams } from "@/lib/validations/params";

import { checkUsersMembership } from "./check-users-membership";

export async function addSupervisorsTx(
  db: PrismaClient,
  newSupervisors: NewSupervisor[],
  { group, subGroup, instance }: InstanceParams,
) {
  return await db.$transaction(async (tx) => {
    const supervisorData = await tx.supervisorDetails.findMany({
      where: {
        allocationGroupId: group,
        allocationSubGroupId: subGroup,
        allocationInstanceId: instance,
      },
      select: { userId: true },
    });

    const { validatedNewUsers, errors } = await checkUsersMembership(
      tx,
      newSupervisors,
      supervisorData.map((s) => s.userId),
    );

    await tx.userInInstance.createMany({
      data: validatedNewUsers.map(({ institutionId }) => ({
        allocationGroupId: group,
        allocationSubGroupId: subGroup,
        allocationInstanceId: instance,
        userId: institutionId,
      })),
      skipDuplicates: true,
    });

    await tx.supervisorDetails.createMany({
      data: validatedNewUsers.map(
        ({ institutionId, projectTarget, projectUpperQuota }) => ({
          allocationGroupId: group,
          allocationSubGroupId: subGroup,
          allocationInstanceId: instance,
          userId: institutionId,
          projectAllocationLowerBound: 0,
          projectAllocationTarget: projectTarget,
          projectAllocationUpperBound: projectUpperQuota,
        }),
      ),
      skipDuplicates: true,
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
