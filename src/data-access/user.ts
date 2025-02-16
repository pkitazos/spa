// TODO: deprecated move operations to DAL

import { expand } from "@/lib/utils/general/instance-params";
import { InstanceParams } from "@/lib/validations/params";

import { db } from "@/db";

// SINGLE
// // find userInInstance
// // get userInInstance
// get userInInstance with [blank] // TODO - make one per relation as needed
// // create userInInstance
// // update userInInstance
// // delete userInInstance

// MANY
// // get all userInInstances
// // get userInInstances by Id
// get userInInstances with [blank] // TODO - make one per relation as needed
// // create userInInstances
// update userInInstances (might not be necessary ?) // ? usually done in a transaction
// // delete userInInstances

export async function createUserInInstance(
  params: InstanceParams,
  userId: string,
) {
  await db.userInInstance.create({ data: { ...expand(params), userId } });
}

export async function deleteUserInInstance(
  params: InstanceParams,
  userId: string,
) {
  return await db.userInInstance.delete({
    where: { instanceMembership: { ...expand(params), userId } },
  });
}

export async function deleteUsersInInstance(
  params: InstanceParams,
  userIds: string[],
) {
  await db.userInInstance.deleteMany({
    where: { ...expand(params), userId: { in: userIds } },
  });
}
