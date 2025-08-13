import { useCallback } from "react";

import { type RowSelectionState, type Updater } from "@tanstack/react-table";
import { parseAsArrayOf, parseAsString, useQueryState } from "nuqs";

import { addPrefix } from "./add-prefix";

export function useRowSelectionSearchParams(prefix?: string) {
  const [selectedRows, setSelectedRows] = useQueryState(
    addPrefix("selected-rows", prefix),
    parseAsArrayOf(parseAsString).withDefault([]),
  );

  const computeRowSelection = useCallback((s: string[]) => {
    return s.reduce((acc, val) => ({ ...acc, [val]: true }), {});
  }, []);

  const rowSelection = computeRowSelection(selectedRows);

  const setRowSelection = useCallback(
    (state: Updater<RowSelectionState>) => {
      void setSelectedRows((old) => {
        if (typeof state === "function") {
          state = state(computeRowSelection(old));
        }

        return Object.keys(state);
      });
    },
    [computeRowSelection, setSelectedRows],
  );

  return [rowSelection, setRowSelection] as const;
}
