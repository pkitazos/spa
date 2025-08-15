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
  allowed: ReactNode;
  denied?: (data: {
    ctx: AccessControlContext;
    reasons: DenialReason[];
  }) => ReactNode;
  loading?: ReactNode;
  error?: ReactNode;
}

export function ConditionalRender({
  loading,
  error,
  allowed,
  denied,
  ...conditions
}: ConditionalRenderProps) {
  const accessState = useAccessControl(conditions);

  if (accessState.status === AccessControlResult.LOADING) {
    return <>{loading ?? null}</>;
  } else if (accessState.status === AccessControlResult.ERROR) {
    return <>{error ?? null}</>;
  }

  return (
    <>
      {accessState.status === AccessControlResult.ALLOWED
        ? allowed
        : denied
          ? denied(accessState)
          : null}
    </>
  );
}
