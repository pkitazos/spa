import { expand } from "@/lib/utils/general/instance-params";
import { InstanceParams } from "@/lib/validations/params";

import { db } from "@/db";

// SINGLE
// // find userInInstance
// // get userInInstance
// get userInInstance with [blank]
// // create userInInstance
// // update userInInstance
// // delete userInInstance

// MANY
// get userInInstances
// get userInInstances with [blank]
// create userInInstances
// update userInInstances (might not be necessary ?)
// delete userInInstances

export async function findUserInInstance(
  params: InstanceParams,
  userId: string,
) {
  return db.userInInstance.findFirst({
    where: { ...expand(params), userId },
  });
}

export async function getUserInInstance(
  params: InstanceParams,
  userId: string,
) {
  return db.userInInstance.findFirstOrThrow({
    where: { ...expand(params), userId },
  });
}

export async function createUserInInstance(
  params: InstanceParams,
  userId: string,
) {
  await db.userInInstance.create({ data: { ...expand(params), userId } });
}

type UserInInstanceData = { joined: boolean };

export async function updateUserInInstance(
  params: InstanceParams,
  userId: string,
  data: UserInInstanceData,
) {
  return db.userInInstance.update({
    where: { instanceMembership: { ...expand(params), userId } },
    data,
  });
}

export async function deleteUserInInstance(
  params: InstanceParams,
  userId: string,
) {
  return db.userInInstance.delete({
    where: { instanceMembership: { ...expand(params), userId } },
  });
}
