"use client";

import { useMemo } from "react";

import { STAGES } from "@/config/stages";

import { getRoleDisplayName, type Role, type Stage } from "@/db/types";

import { api } from "@/lib/trpc/client";
import { setIntersection } from "@/lib/utils/general/set-intersection";

import { useInstanceParams } from "../params-context";

export interface AccessConditions {
  allowedRoles?: Role[];
  allowedStages?: Stage[];
  customCondition?: (context: {
    userRoles: Role[];
    currentStage: Stage;
  }) => boolean;
  extraConditions?: {
    RBAC?: { AND?: boolean; OR?: boolean };
    SBAC?: { AND?: boolean; OR?: boolean };
  };
}

export interface AccessControlState {
  allowed: boolean;
  denied: boolean;
  userRoles: Role[];
  currentStage: Stage;
  reason?: string;
  isLoading: boolean;
}

export function useAccessControl(
  conditions: AccessConditions = {},
): AccessControlState {
  const params = useInstanceParams();

  const { data: userRoles, isSuccess: rolesLoaded } = api.user.roles.useQuery({
    params,
  });
  const { data: currentStage, isSuccess: stageLoaded } =
    api.institution.instance.currentStage.useQuery({ params });

  const isLoading = !rolesLoaded || !stageLoaded;

  return useMemo(() => {
    if (isLoading || !userRoles || !currentStage) {
      return {
        allowed: false,
        denied: true,
        userRoles: [],
        currentStage: currentStage as unknown as Stage,
        reason: "Loading access permissions...",
        isLoading: true,
      };
    }

    const { allowedRoles, allowedStages, customCondition, extraConditions } =
      conditions;

    const userRolesArray = Array.from(userRoles);
    let allowed = true;
    let reason: string | undefined;

    if (allowedRoles && allowedRoles.length > 0) {
      const hasRequiredRole =
        setIntersection(allowedRoles, userRolesArray, (x) => x).length > 0;
      const rbacOR = extraConditions?.RBAC?.OR ?? false;
      const rbacAND = extraConditions?.RBAC?.AND ?? true;

      if (rbacOR) {
        // grant access regardless of role if OR condition is true
        allowed = true;
      } else if (!rbacAND) {
        // deny access regardless of role if AND condition is false
        allowed = false;
        reason = "Access denied by role condition";
      } else if (!hasRequiredRole) {
        allowed = false;
        const allowedRolesLabel = allowedRoles
          .map(getRoleDisplayName)
          .join(", ");
        const userRolesLabel = userRolesArray
          .map(getRoleDisplayName)
          .join(", ");
        reason = `Access restricted to roles: ${allowedRolesLabel}. Your roles: ${userRolesLabel}`;
      }
    }

    if (allowedStages && allowedStages.length > 0) {
      const hasRequiredStage = allowedStages.includes(currentStage);
      const sbacOR = extraConditions?.SBAC?.OR ?? false;
      const sbacAND = extraConditions?.SBAC?.AND ?? true;

      if (sbacOR) {
        // grant access regardless of stage if OR condition is true
        allowed = true;
      } else if (!sbacAND) {
        // deny access regardless of stage if AND condition is false
        allowed = false;
        reason = "Access denied by stage condition";
      } else if (!hasRequiredStage) {
        allowed = false;
        const allowedStagesLabel = allowedStages
          .map((stage) => STAGES[stage].displayName)
          .join(", ");
        const currentStageLabel = STAGES[currentStage].displayName;
        reason = `Access not available in current stage: ${currentStageLabel}. Available in: ${allowedStagesLabel}`;
      }
    }

    if (customCondition) {
      const customConditionCheck = customCondition({
        userRoles: userRolesArray,
        currentStage,
      });

      if (!customConditionCheck) {
        allowed = false;
        reason = reason ?? "Access condition not met";
      }
    }

    return {
      allowed,
      denied: !allowed,
      userRoles: userRolesArray,
      currentStage,
      reason,
      isLoading: false,
    };
  }, [isLoading, userRoles, currentStage, conditions]);
}
