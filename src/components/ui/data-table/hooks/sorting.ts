import { Updater, SortingState } from "@tanstack/react-table";
import { useQueryStates, parseAsBoolean, parseAsString } from "nuqs";
import { useCallback } from "react";
import { useProxyState } from "./use-proxy-state";

export function useSortingSearchParams() {
  const [state, setVals] = useQueryStates(
    {
      desc: parseAsBoolean.withDefault(true),
      id: parseAsString.withDefault(""),
    },
    { urlKeys: { desc: "desc", id: "sort-col" } },
  );

  const computeSorting = useCallback(
    ({ desc, id }: { desc: boolean; id: string }) =>
      (id ? [{ id, desc }] : []) as SortingState,
    [],
  );

  const sorting = computeSorting(state);

  const setSorting = useCallback(
    (state: Updater<SortingState>) => {
      setVals((s) => {
        if (typeof state === "function") {
          state = state(computeSorting(s));
        }

        return state[0] ?? [];
      });
    },
    [setVals, computeSorting],
  );

  return useProxyState(sorting, setSorting, []);
}
