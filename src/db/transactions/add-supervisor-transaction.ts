import { PrismaClient } from "@prisma/client";
import { TRPCClientError } from "@trpc/client";

import { expand } from "@/lib/utils/general/instance-params";
import { NewSupervisor } from "@/lib/validations/add-users/new-user";
import { InstanceParams } from "@/lib/validations/params";

import { validateEmailGUIDMatch } from "@/server/utils/id-email-check";

import {
  createSupervisorDetails,
  findSupervisorDetails,
} from "@/data-access/supervisor-details";

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
  // ? Not sure how to separate this out into data-access functions and a use-case for business logic since I'm doing validation checks within the transaction itself
  return await db.$transaction(async (tx) => {
    // ! this should accept the prisma client
    const exists = await findSupervisorDetails(params, institutionId);
    if (exists) throw new TRPCClientError("User is already a supervisor");

    await validateEmailGUIDMatch(tx, institutionId, email, fullName);

    await db.userInInstance.create({
      data: { ...expand(params), userId: institutionId },
    });

    // ! this should accept the prisma client
    await createSupervisorDetails(params, institutionId, {
      projectAllocationLowerBound: 0,
      projectAllocationTarget: projectTarget,
      projectAllocationUpperBound: projectUpperQuota,
    });

    return {
      institutionId,
      fullName,
      email,
      projectTarget,
      projectUpperQuota,
    };
  });
}
