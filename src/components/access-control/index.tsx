"use client";

import { type ReactNode } from "react";

import { Role, type Stage, stageSchema } from "@/db/types";

import { RBAC } from "./rbac";
import { SBAC } from "./sbac";

/**
 * @deprecated use ConditionalRender instead
 */
export function AccessControl({
  children,
  allowedStages = stageSchema.options,
  allowedRoles = [Role.ADMIN, Role.SUPERVISOR, Role.STUDENT],
  extraConditions,
}: {
  children: ReactNode;
  allowedStages?: Stage[];
  allowedRoles?: Role[];
  extraConditions?: {
    RBAC?: { AND?: boolean; OR?: boolean };
    SBAC?: { AND?: boolean; OR?: boolean };
  };
}) {
  return (
    <RBAC
      allowedRoles={allowedRoles}
      AND={extraConditions?.RBAC?.AND}
      OR={extraConditions?.RBAC?.OR}
    >
      <SBAC
        allowedStages={allowedStages}
        AND={extraConditions?.SBAC?.AND}
        OR={extraConditions?.SBAC?.OR}
      >
        {children}
      </SBAC>
    </RBAC>
  );
}

export { ConditionalRender } from "./conditional-render";

export { useAccessControl } from "./use-access-control";
export type {
  CustomCondition,
  AccessCondition,
  DenialReason,
  AccessControlState,
} from "./types";
