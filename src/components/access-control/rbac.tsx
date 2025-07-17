"use client";

import { type ReactNode } from "react";

import { type Role } from "@/db/types";

import { api } from "@/lib/trpc/client";
import { setIntersection } from "@/lib/utils/general/set-intersection";

import { useInstanceParams } from "../params-context";

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

  const { data: userRoles, isSuccess } = api.user.roles.useQuery({ params });
  if (!isSuccess) return <></>;

  const userAllowed =
    setIntersection(allowedRoles, Array.from(userRoles), (x) => x).length > 0;
  if (OR || (AND && userAllowed)) return <>{children}</>;
}
