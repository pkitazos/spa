"use client";

import { type ReactNode } from "react";

import { type Stage } from "@prisma/client";

import { api } from "@/lib/trpc/client";

import { useInstanceParams } from "../params-context";

export function SBAC({
  children,
  allowedStages,
  AND = true,
  OR = false,
}: {
  children: ReactNode;
  allowedStages: Stage[];
  AND?: boolean;
  OR?: boolean;
}) {
  const params = useInstanceParams();
  const { data: stage, isSuccess } =
    api.institution.instance.currentStage.useQuery({ params });

  if (!isSuccess) return <></>;
  if (OR || (AND && allowedStages.includes(stage))) return <>{children}</>;

  return <></>;
}
