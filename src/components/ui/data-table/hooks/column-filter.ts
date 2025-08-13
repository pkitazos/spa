import { useCallback } from "react";

import {
  type Updater,
  type ColumnDef,
  type ColumnFiltersState,
} from "@tanstack/react-table";
import { useQueryStates, parseAsString } from "nuqs";

import { addPrefix } from "./add-prefix";
import { useProxyState } from "./use-proxy-state";

export function useColumnFilterSearchParams<T, V>(
  cols: ColumnDef<T, V>[],
  prefix?: string,
) {
  const [filters, setFilters] = useQueryStates(
    cols.reduce(
      (acc, val) => ({ ...acc, [val.id!]: parseAsString.withDefault("") }),
      {},
    ),
    {
      urlKeys: cols.reduce(
        (acc, val) => ({
          ...acc,
          [val.id!]: addPrefix(`filter-${val.id?.replace(" ", "-")}`, prefix),
        }),
        {},
      ),
    },
  );

  const computeColFilters = useCallback((filters: Record<string, string>) => {
    return Object.entries(filters)
      .filter(([_, v]) => Boolean(v))
      .map(([id, value]) => ({ id, value })) as ColumnFiltersState;
  }, []);

  const colFilters = computeColFilters(filters);

  const setColFilters = useCallback(
    (state: Updater<ColumnFiltersState>) => {
      void setFilters((oldFilters) => {
        if (typeof state === "function") {
          state = state(computeColFilters(oldFilters));
        }

        const a = cols.reduce(
          (acc, { id }) => ({
            ...acc,
            [id!]:
              (state as ColumnFiltersState).find((v) => v.id == id)?.value ??
              "",
          }),
          {},
        );
        console.log(a);

        return a;
      });
    },
    [setFilters, cols, computeColFilters],
  );

  return useProxyState(colFilters, setColFilters, []);
}
