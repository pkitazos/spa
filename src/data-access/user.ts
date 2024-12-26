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

export async function findUserInInstance(
  params: InstanceParams,
  userId: string,
) {
  return await db.userInInstance.findFirst({
    where: { ...expand(params), userId },
  });
}

export async function getUserInInstance(
  params: InstanceParams,
  userId: string,
) {
  return await db.userInInstance.findFirstOrThrow({
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
  return await db.userInInstance.update({
    where: { instanceMembership: { ...expand(params), userId } },
    data,
  });
}

export async function deleteUserInInstance(
  params: InstanceParams,
  userId: string,
) {
  return await db.userInInstance.delete({
    where: { instanceMembership: { ...expand(params), userId } },
  });
}

export async function getAllUsersInInstance(params: InstanceParams) {
  return db.userInInstance.findMany({
    where: expand(params),
  });
}

export async function getUsersInInstance(
  params: InstanceParams,
  userIds: string[],
) {
  return await db.userInInstance.findMany({
    where: { ...expand(params), userId: { in: userIds } },
  });
}

export async function createUsersInInstance(
  params: InstanceParams,
  userIds: string[],
) {
  await db.userInInstance.createMany({
    data: userIds.map((userId) => ({ ...expand(params), userId })),
  });
}

export async function deleteAllUserInInstances(params: InstanceParams) {
  await db.userInInstance.deleteMany({ where: expand(params) });
}

export async function deleteUsersInInstance(
  params: InstanceParams,
  userIds: string[],
) {
  await db.userInInstance.deleteMany({
    where: { ...expand(params), userId: { in: userIds } },
  });
}
