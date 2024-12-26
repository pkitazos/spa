import { PrismaClient } from "@prisma/client";

import { PrismaTransactionClient } from "@/db";
import {
  GroupParams,
  groupParamsSchema,
  InstanceParams,
  RefinedSpaceParams,
  SpaceParams,
  SubGroupParams,
  subGroupParamsSchema,
} from "@/lib/validations/params";

import { dispatchBySpace } from "../space/dispatch";

import { isGroupAdmin } from "./is-group-admin";
import { isSubGroupAdmin } from "./is-sub-group-admin";
import { isSuperAdmin } from "./is-super-admin";

/**
 * @deprecated
 */
export async function adminAccess(
  db: PrismaClient,
  userId: string,
  params: SpaceParams,
) {
  const result = subGroupParamsSchema.safeParse(params);

  if (!result.success) {
    const { group } = groupParamsSchema.parse(params);

    const access = await db.adminInSpace.findFirst({
      where: {
        allocationGroupId: group,
        allocationSubGroupId: null,
        userId,
      },
    });
    return !!access;
  }

  const { group, subGroup } = result.data;

  const access = await db.adminInSpace.findFirst({
    where: {
      allocationGroupId: group,
      userId,
      OR: [{ allocationSubGroupId: subGroup }, { allocationSubGroupId: null }],
    },
  });
  return !!access;
}

// TODO: check if function can be substituted with subGroupAdmin check
async function isAdminInInstance(
  db: PrismaTransactionClient,
  { group, subGroup }: InstanceParams,
  userId: string,
) {
  const admin = await db.adminInSpace.findFirst({
    where: {
      userId,
      OR: [
        { allocationGroupId: group, allocationSubGroupId: subGroup },
        { allocationGroupId: group, allocationSubGroupId: null },
      ],
    },
  });
  return !!admin;
}

/**
 * Verifies if a user has the necessary admin permissions within a specific space.
 *
 * @description
 * This function determines if the user possesses the required admin level
 * based on the type of space (group, sub-group, or instance) they are currently in.
 *
 * 1. Checks if the user is a super admin. If so, grants access immediately.
 *
 * 2. If the space is an instance:
 *    - Validates `params` against `instanceParamsSchema`.
 *    - Checks if the user is an admin within the instance.
 *
 * 3. If the space is a sub-group:
 *    - Validates `params` against `subGroupParamsSchema`.
 *    - Checks if the user is an admin within the group. If so, grants access.
 *    - If not a group admin, checks if the user is an admin within the sub-group.
 *
 * 4. Otherwise (if the space is a group):
 *    - Checks if the user is an admin within the group.
 *
 */
export async function checkAdminPermissions(
  db: PrismaTransactionClient,
  params: RefinedSpaceParams,
  userId: string,
) {
  const superAdmin = await isSuperAdmin(db, userId);
  if (superAdmin) return true;

  function handleGroup(p: GroupParams) {
    return isGroupAdmin(db, p, userId);
  }

  async function handleSubGroup(p: SubGroupParams) {
    const inGroup = await isGroupAdmin(db, p, userId);
    if (inGroup) return true;
    return isSubGroupAdmin(db, p, userId);
  }

  async function handleInstance(p: InstanceParams) {
    return isAdminInInstance(db, p, userId);
  }

  return dispatchBySpace(params, handleGroup, handleSubGroup, handleInstance);
}
