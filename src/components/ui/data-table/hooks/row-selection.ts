import { RowSelectionState, Updater } from "@tanstack/react-table";
import { parseAsArrayOf, parseAsString, useQueryState } from "nuqs";
import { useCallback } from "react";

export function useRowSelectionSearchParams() {
  const [selectedRows, setSelectedRows] = useQueryState(
    "selected-rows",
    parseAsArrayOf(parseAsString).withDefault([]),
  );

  const computeRowSelection = useCallback((s: string[]) => {
    return s.reduce((acc, val) => ({ ...acc, [val]: true }), {});
  }, []);

  const rowSelection = computeRowSelection(selectedRows);

  const setRowSelection = useCallback((state: Updater<RowSelectionState>) => {
    setSelectedRows((old) => {
      if (typeof state === "function") {
        state = state(computeRowSelection(old));
      }

      return Object.keys(state);
    });
  }, []);

  return [rowSelection, setRowSelection] as const;
}
