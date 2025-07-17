"use client";

import { useState, useEffect, useCallback } from "react";

import type { Updater } from "@tanstack/react-table";

export function useProxyState<TState>(
  state: TState,
  setState: (v: Updater<TState>) => void,
  init: TState,
): readonly [TState, (v: Updater<TState>) => void] {
  const [shadowState, setShadowState] = useState<TState>(init);

  useEffect(() => {
    setShadowState(state);
  }, []);

  const realSetter = useCallback(
    (s: Updater<TState>) => {
      setState(s);
      setShadowState(s);
    },
    [setState, setShadowState],
  );

  return [shadowState, realSetter] as const;
}
