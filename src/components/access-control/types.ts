"use client";

import type { Stage } from "@prisma/client";

import type { Role } from "@/db/types";

export interface AccessControlContext {
  userRoles: Role[];
  currentStage: Stage;
}

export type CustomCondition = (context: AccessControlContext) => boolean;

export interface AccessCondition {
  allowedRoles?: Role[];
  allowedStages?: Stage[];
  customCondition?: CustomCondition;
}

export const AccessControlResult = {
  LOADING: "LOADING",
  ERROR: "ERROR",
  ALLOWED: "ALLOWED",
  DENIED: "DENIED",
} as const;

export const DenialReason = {
  BAD_ROLE: "BAD_ROLE",
  BAD_STAGE: "BAD_STAGE",
  BAD_CUSTOM: "BAD_CUSTOM",
} as const;

export type DenialReason =
  | { code: typeof DenialReason.BAD_ROLE; allowedRoles: Role[] }
  | { code: typeof DenialReason.BAD_STAGE; allowedStages: Stage[] }
  | { code: typeof DenialReason.BAD_CUSTOM };

export type AccessControlState =
  | { status: typeof AccessControlResult.LOADING }
  | { status: typeof AccessControlResult.ERROR }
  | { status: typeof AccessControlResult.ALLOWED; ctx: AccessControlContext }
  | {
      status: typeof AccessControlResult.DENIED;
      ctx: AccessControlContext;
      reasons: DenialReason[];
    };
