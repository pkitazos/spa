import { useCallback } from "react";

import {
  type Updater,
  type ColumnDef,
  type VisibilityState,
} from "@tanstack/react-table";
import { useQueryState, parseAsArrayOf, parseAsString } from "nuqs";

export function useVisibilitySearchParams<T, V>(cols: ColumnDef<T, V>[]) {
  const [hidden, setHidden] = useQueryState(
    "hidden",
    parseAsArrayOf(parseAsString, ",").withDefault([]),
  );

  const computeVisible = useCallback(
    (hidden: string[]) =>
      cols.reduce(
        (acc, val) => ({ ...acc, [val.id!]: !hidden.includes(val.id!) }),
        {},
      ),
    [cols],
  );

  const visibilityState = computeVisible(hidden);

  const setVisibilityState = useCallback(
    (state: Updater<VisibilityState>) => {
      void setHidden((oldHidden) => {
        if (typeof state === "function") {
          state = state(computeVisible(oldHidden));
        }

        return Object.entries(state)
          .filter(([_, v]) => !v)
          .map(([k, _]) => k);
      });
    },
    [setHidden, computeVisible],
  );

  return [visibilityState, setVisibilityState] as const;
}
