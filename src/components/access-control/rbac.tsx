"use client";
import { ReactNode } from "react";

import { api } from "@/lib/trpc/client";

import { useInstanceParams } from "../params-context";

import { Role } from "@/db/types";
import { setIntersection } from "@/lib/utils/general/set-intersection";

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
