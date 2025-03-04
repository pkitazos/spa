"use client";
import { ReactNode } from "react";

import { api } from "@/lib/trpc/client";

import { useInstanceParams } from "../params-context";

import { Role } from "@/db/types";

export function RBAC({
  children,
  allowedRoles,
  AND = true,
  OR = false,
}: {
  children: ReactNode;
  allowedRoles: Role[];
  AND?: boolean;
  OR?: boolean;
}) {
  const params = useInstanceParams();
  const allowedRolesSet = new Set(allowedRoles);

  const { data: userRoles, isSuccess } = api.user.roles.useQuery({ params });
  if (!isSuccess) return <></>;

  const userAllowed = allowedRolesSet.intersection(userRoles).size > 0;
  if (OR || (AND && userAllowed)) return <>{children}</>;

  return <></>;
}
