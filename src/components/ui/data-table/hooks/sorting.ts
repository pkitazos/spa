import { useCallback } from "react";

import { type Updater, type SortingState } from "@tanstack/react-table";
import { useQueryStates, parseAsBoolean, parseAsString } from "nuqs";

import { addPrefix } from "./add-prefix";
import { useProxyState } from "./use-proxy-state";

export function useSortingSearchParams(prefix?: string) {
  const [state, setVals] = useQueryStates(
    {
      desc: parseAsBoolean.withDefault(true),
      id: parseAsString.withDefault(""),
    },
    {
      urlKeys: {
        desc: addPrefix("sort-desc", prefix),
        id: addPrefix("sort-col", prefix),
      },
    },
  );

  const computeSorting = useCallback(
    ({ desc, id }: { desc: boolean; id: string }) =>
      (id ? [{ id, desc }] : []) as SortingState,
    [],
  );

  const sorting = computeSorting(state);

  const setSorting = useCallback(
    (state: Updater<SortingState>) => {
      void setVals((s) => {
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
