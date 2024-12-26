import { PrismaClient } from "@prisma/client";

import { InstanceParams } from "@/lib/validations/params";

import { checkAdminPermissions } from "../admin/access";

import { PrismaTransactionClient, Role } from "@/db";

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

export async function getAllUserRoles(
  db: PrismaTransactionClient,
  params: InstanceParams,
  userId: string,
) {
  const roles: Role[] = [];

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
