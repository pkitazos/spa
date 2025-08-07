"use client";

import { type ReactNode } from "react";

import { useParams } from "next/navigation";

import { AdminLevel } from "@/db/types";

import { api } from "@/lib/trpc/client";
import { permissionCheck } from "@/lib/utils/permissions/permission-check";
import { type RefinedSpaceParams } from "@/lib/validations/params";

export function AdminLevelAC({
  children,
  minimumAdminLevel = AdminLevel.SUB_GROUP,
}: {
  children: ReactNode;
  minimumAdminLevel?: AdminLevel;
}) {
  const params = useParams<RefinedSpaceParams>();
  const { data, status } = api.ac.getAdminLevelInSpace.useQuery({ params });

  if (status !== "success") return <></>;
  if (permissionCheck(data, minimumAdminLevel)) return <>{children}</>;

  return <></>;
}
