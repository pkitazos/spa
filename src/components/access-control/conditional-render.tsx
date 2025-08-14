"use client";

import { type ReactNode } from "react";

import {
  type AccessCondition,
  type AccessControlContext,
  AccessControlResult,
  type DenialReason,
} from "./types";
import { useAccessControl } from "./use-access-control";

interface ConditionalRenderProps extends AccessCondition {
  components: {
    allowed: ReactNode;
    denied: (data: {
      ctx: AccessControlContext;
      reasons: DenialReason[];
    }) => ReactNode;
    loading?: ReactNode;
    error?: ReactNode;
  };
}

export function ConditionalRender({
  components,
  ...conditions
}: ConditionalRenderProps) {
  const accessState = useAccessControl(conditions);

  if (accessState.status === AccessControlResult.LOADING) {
    return <>{components.loading ?? null}</>;
  } else if (accessState.status === AccessControlResult.ERROR) {
    return <>{components.error ?? null}</>;
  }

  return (
    <>
      {accessState.status === AccessControlResult.ALLOWED
        ? components.allowed
        : components.denied(accessState)}
    </>
  );
}

// TODO - just fill in the above component with sensible defaults
export function ConditionalRenderSimple({
  children,
  fallback,
  ...condition
}: AccessCondition & { children: ReactNode; fallback?: ReactNode }) {
  const accessState = useAccessControl(condition);

  if (accessState.status === AccessControlResult.LOADING) {
    return null;
  }

  return (
    <>
      {accessState.status === AccessControlResult.ALLOWED ? children : fallback}
    </>
  );
}
