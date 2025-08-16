"use client";

import { type ReactNode } from "react";

import { Slot } from "@radix-ui/react-slot";

import { WithTooltip } from "../ui/tooltip-wrapper";

import { FormatDenials } from "./format-denial";
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

interface ConditionalDisableProps extends AccessCondition {
  children: ReactNode;
}

export function ConditionalDisable({
  children,
  ...conditions
}: ConditionalDisableProps) {
  return (
    <ConditionalRender
      {...conditions}
      allowed={children}
      denied={(denialData) => (
        <WithTooltip tip={<FormatDenials {...denialData} />}>
          {/* @ts-expect-error trust me bro*/}
          <Slot disabled>{children}</Slot>
        </WithTooltip>
      )}
      loading={
        <WithTooltip tip="Checking Access Control...">
          {/* @ts-expect-error trust me bro*/}
          <Slot disabled>{children}</Slot>
        </WithTooltip>
      }
      error={
        <WithTooltip tip={"Access Control Error"}>
          {/* @ts-expect-error trust me bro*/}
          <Slot disabled>{children}</Slot>
        </WithTooltip>
      }
    />
  );
}
