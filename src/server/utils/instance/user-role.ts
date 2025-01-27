import { PrismaClient } from "@prisma/client";

import { InstanceParams } from "@/lib/validations/params";

import { checkAdminPermissions } from "../admin/access";

import { SystemRole } from "@/db/types";
import { TX } from "@/db/types";

/**
 *
 * @deprecated users can have multiple roles
 */
export async function getUserRole(
  db: PrismaClient,
  params: InstanceParams,
  userId: string,
) {
  const isAdmin = await checkAdminPermissions(db, params, userId);
  if (isAdmin) return Role.ADMIN;

  const userInInstance = await db.userInInstance.findFirstOrThrow({
    where: {
      allocationGroupId: params.group,
      allocationSubGroupId: params.subGroup,
      allocationInstanceId: params.instance,
      userId,
    },
  });

  return userInInstance.role;
}

/**
 *
 * @deprecated use user object to determine roles
 */
export async function getAllUserRoles(
  db: TX,
  params: InstanceParams,
  userId: string,
) {
  const roles: SystemRole[] = [];

  const admin = await checkAdminPermissions(db, params, userId);
  if (admin) roles.push(Role.ADMIN);

  const userInInstance = await db.userInInstance.findFirst({
    where: {
      allocationGroupId: params.group,
      allocationSubGroupId: params.subGroup,
      allocationInstanceId: params.instance,
      userId,
    },
    select: { role: true },
  });
  if (userInInstance) roles.push(userInInstance.role);

  return new Set(roles);
}
