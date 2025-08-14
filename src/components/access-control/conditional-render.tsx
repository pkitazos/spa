"use client";

import { type ReactNode } from "react";

import { type AccessConditions, useAccessControl } from "./use-access-control";

interface ConditionalRenderProps extends AccessConditions {
  children: (state: ReturnType<typeof useAccessControl>) => ReactNode;
}

interface ConditionalRenderMappingProps extends AccessConditions {
  components: { allowed: ReactNode; denied: ReactNode; loading?: ReactNode };
}

export function ConditionalRender({
  children,
  ...conditions
}: ConditionalRenderProps) {
  const accessState = useAccessControl(conditions);
  return <>{children(accessState)}</>;
}

export function ConditionalRenderMapping({
  components,
  ...conditions
}: ConditionalRenderMappingProps) {
  const accessState = useAccessControl(conditions);

  if (accessState.isLoading) {
    return <>{components.loading ?? null}</>;
  }

  return <>{accessState.allowed ? components.allowed : components.denied}</>;
}

export function ConditionalRenderSimple({
  children,
  fallback,
  ...conditions
}: AccessConditions & { children: ReactNode; fallback?: ReactNode }) {
  const accessState = useAccessControl(conditions);

  if (accessState.isLoading) {
    return null;
  }

  return <>{accessState.allowed ? children : fallback}</>;
}
