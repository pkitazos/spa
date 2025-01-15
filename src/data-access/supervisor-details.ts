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

export async function getSupervisorDetails(
  params: InstanceParams,
  userId: string,
) {
  return db.supervisorDetails.findFirstOrThrow({
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

export async function updateSupervisorDetails(
  params: InstanceParams,
  userId: string,
  data: Partial<SupervisorDetailsData>,
) {
  return db.supervisorDetails.update({
    where: { supervisorDetailsId: { ...expand(params), userId } },
    data,
  });
}

export async function deleteSupervisorDetails(
  params: InstanceParams,
  userId: string,
) {
  return db.supervisorDetails.delete({
    where: { supervisorDetailsId: { ...expand(params), userId } },
  });
}
