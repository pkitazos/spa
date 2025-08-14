"use client";

import { useMemo } from "react";

import { type Role, type Stage } from "@/db/types";

import { api } from "@/lib/trpc/client";
import { setIntersection } from "@/lib/utils/general/set-intersection";

import { useInstanceParams } from "../params-context";

import {
  type CustomCondition,
  type AccessCondition,
  type AccessControlState,
  AccessControlResult,
  type DenialReason,
} from "./types";

function checkRoles(userRoles: Role[], allowedRoles?: Role[]): boolean {
  if (!allowedRoles || allowedRoles.length == 0) return true;
  else return setIntersection(allowedRoles, userRoles, (x) => x).length > 0;
}

function checkStage(currentStage: Stage, allowedStages?: Stage[]): boolean {
  if (!allowedStages || allowedStages.length == 0) return true;
  else return allowedStages.includes(currentStage);
}

function checkCondition(
  userRoles: Role[],
  currentStage: Stage,
  customCondition?: CustomCondition,
): boolean {
  if (!customCondition) return true;
  else return customCondition({ userRoles, currentStage });
}

export function useAccessControl(
  conditions: AccessCondition = {},
): AccessControlState {
  const params = useInstanceParams();

  const { data: userRolesSet, isSuccess: rolesLoaded } =
    api.user.roles.useQuery({ params });
  const { data: currentStage, isSuccess: stageLoaded } =
    api.institution.instance.currentStage.useQuery({ params });

  const isLoading = !rolesLoaded || !stageLoaded;

  return useMemo(() => {
    if (isLoading) {
      return { status: AccessControlResult.LOADING };
    } else if (!userRolesSet || !currentStage) {
      return { status: AccessControlResult.ERROR };
    }

    const { allowedRoles, allowedStages, customCondition } = conditions;

    const userRoles = Array.from(userRolesSet);

    const hasRequiredRole = checkRoles(userRoles, allowedRoles);
    const hasRequiredStage = checkStage(currentStage, allowedStages);
    const passesCustomCondition = checkCondition(
      userRoles,
      currentStage,
      customCondition,
    );

    if (hasRequiredRole && hasRequiredStage && passesCustomCondition) {
      return {
        status: AccessControlResult.ALLOWED,
        ctx: { userRoles, currentStage },
      };
    } else {
      const reasons: DenialReason[] = [];

      if (!hasRequiredRole && allowedRoles) {
        reasons.push({ code: "BAD_ROLE", allowedRoles });
      }
      if (!hasRequiredStage && allowedStages) {
        reasons.push({ code: "BAD_STAGE", allowedStages });
      }
      if (!passesCustomCondition) {
        reasons.push({ code: "BAD_CUSTOM" });
      }

      return {
        status: AccessControlResult.DENIED,
        ctx: { userRoles, currentStage },
        reasons,
      } satisfies AccessControlState;
    }
  }, [isLoading, userRolesSet, currentStage, conditions]);
}
