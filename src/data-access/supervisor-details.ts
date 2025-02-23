// TODO: deprecated move operations to DAL
import { expand } from "@/lib/utils/general/instance-params";
import { InstanceParams } from "@/lib/validations/params";

import { db } from "@/db";

export async function findSupervisorDetails(
  params: InstanceParams,
  userId: string,
) {
  return db.supervisorDetails.findFirst({
    where: { ...expand(params), userId },
  });
}

// TODO: make DTO
type SupervisorDetailsData = {
  projectAllocationLowerBound: number;
  projectAllocationTarget: number;
  projectAllocationUpperBound: number;
};

export async function createSupervisorDetails(
  params: InstanceParams,
  userId: string,
  data: SupervisorDetailsData,
) {
  await db.supervisorDetails.create({
    data: { ...expand(params), userId, ...data },
  });
}
