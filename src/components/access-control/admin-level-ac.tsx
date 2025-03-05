"use client";
import { ReactNode } from "react";
import { useParams } from "next/navigation";

import { api } from "@/lib/trpc/client";
import { permissionCheck } from "@/lib/utils/permissions/permission-check";
import { RefinedSpaceParams } from "@/lib/validations/params";
import { AdminLevel } from "@/db/types";

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
