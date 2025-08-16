"use client";

import { useMemo } from "react";

import { type Role, type Stage } from "@/db/types";

import { api } from "@/lib/trpc/client";
import { hasOverlap } from "@/lib/utils/general/set-intersection";

import { useInstanceParams } from "../params-context";

import {
  DenialReason,
  type CustomCondition,
  type AccessCondition,
  type AccessControlState,
  AccessControlResult,
  type ACOverrides,
} from "./types";

function checkRoles(
  userRoles: Role[],
  allowedRoles?: Role[],
  { AND = true, OR = false }: ACOverrides = {},
): boolean {
  if (!allowedRoles || allowedRoles.length == 0) return true;
  else return OR || (AND && hasOverlap(allowedRoles, userRoles, (x) => x));
}

function checkStage(
  currentStage: Stage,
  allowedStages?: Stage[],
  { AND = true, OR = false }: ACOverrides = {},
): boolean {
  if (!allowedStages || allowedStages.length == 0) return true;
  else return OR || (AND && allowedStages.includes(currentStage));
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

    const { allowedRoles, allowedStages, customCondition, overrides } =
      conditions;

    const userRoles = Array.from(userRolesSet);

    const hasRequiredRole = checkRoles(
      userRoles,
      allowedRoles,
      overrides?.roles,
    );
    const hasRequiredStage = checkStage(
      currentStage,
      allowedStages,
      overrides?.stage,
    );
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
        reasons.push({ code: DenialReason.BAD_ROLE, allowedRoles });
      }
      if (!hasRequiredStage && allowedStages) {
        reasons.push({ code: DenialReason.BAD_STAGE, allowedStages });
      }
      if (!passesCustomCondition) {
        reasons.push({ code: DenialReason.BAD_CUSTOM });
      }

      return {
        status: AccessControlResult.DENIED,
        ctx: { userRoles, currentStage },
        reasons,
      } satisfies AccessControlState;
    }
  }, [isLoading, userRolesSet, currentStage, conditions]);
}
