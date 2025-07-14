import { Updater, ColumnDef, ColumnFiltersState } from "@tanstack/react-table";
import { useQueryStates, parseAsString } from "nuqs";
import { useCallback } from "react";
import { useProxyState } from "./use-proxy-state";

export function useColumnFilterSearchParams<T, V>(cols: ColumnDef<T, V>[]) {
  const [filters, setFilters] = useQueryStates(
    cols.reduce(
      (acc, val) => ({ ...acc, [val.id!]: parseAsString.withDefault("") }),
      {},
    ),
    {
      urlKeys: cols.reduce(
        (acc, val) => ({
          ...acc,
          [val.id!]: `filter-${val.id?.replace(" ", "-")}`,
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
      setFilters((oldFilters) => {
        if (typeof state === "function") {
          state = state(computeColFilters(oldFilters));
        }

        state;

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
    [setFilters, computeColFilters],
  );

  return useProxyState(colFilters, setColFilters, []);
}
