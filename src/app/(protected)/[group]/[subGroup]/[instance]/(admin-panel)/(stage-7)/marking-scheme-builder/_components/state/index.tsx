"use client";

import { type ReactNode, createContext, useRef, useContext } from "react";
import { useStore } from "zustand";
import { createMarkingSchemeStore, MarkingSchemeStore, State } from "./store";

export type MarkingSchemeStoreAPI = ReturnType<typeof createMarkingSchemeStore>;

export const MarkingSchemeContext = createContext<
  MarkingSchemeStoreAPI | undefined
>(undefined);

export const MarkingSchemeStoreProvider = ({
  children,
  initialState,
}: {
  children: ReactNode;
  initialState: State;
}) => {
  const storeRef = useRef<MarkingSchemeStoreAPI>();
  if (!storeRef.current) {
    storeRef.current = createMarkingSchemeStore(initialState);
  }

  return (
    <MarkingSchemeContext.Provider value={storeRef.current}>
      {children}
    </MarkingSchemeContext.Provider>
  );
};

export const useMarkingSchemeStore = <T,>(
  selector: (store: MarkingSchemeStore) => T,
): T => {
  const counterStoreContext = useContext(MarkingSchemeContext);

  if (!counterStoreContext) {
    throw new Error(`useCounterStore must be used within CounterStoreProvider`);
  }

  return useStore(counterStoreContext, selector);
};
