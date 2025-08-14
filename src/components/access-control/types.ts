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

export type DenialReason =
  | { code: "BAD_ROLE"; allowedRoles: Role[] }
  | { code: "BAD_STAGE"; allowedStages: Stage[] }
  | { code: "BAD_CUSTOM" };

export type AccessControlState =
  | { status: "LOADING" }
  | { status: "ERROR" }
  | { status: "ALLOWED"; ctx: AccessControlContext }
  | { status: "DENIED"; ctx: AccessControlContext; reasons: DenialReason[] };
