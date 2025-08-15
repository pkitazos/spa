"use client";

import { useMemo } from "react";

import { type Table } from "@tanstack/react-table";
import { XCircleIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DataTableFacetedFilter } from "@/components/ui/data-table/data-table-faceted-filter";
import { Input } from "@/components/ui/input";

import { nubsById } from "@/lib/utils/list-unique";

import { type ManualAllocationStudent } from "./manual-allocation-types";

interface ManualAllocationToolbarProps {
  table: Table<ManualAllocationStudent>;
  students: ManualAllocationStudent[];
}

export function ManualAllocationToolbar({
  table,
  students,
}: ManualAllocationToolbarProps) {
  const isFiltered = table.getState().columnFilters.length > 0;

  const availableFlags = useMemo(() => {
    return students.map((s) => s.flag).filter(nubsById);
  }, [students]);

  return (
    <div className="flex w-full items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        <Input
          placeholder="Search students"
          value={(table.getColumn("student")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("student")?.setFilterValue(event.target.value)
          }
          className="h-8 max-w-[150px] lg:max-w-[300px]"
        />

        <DataTableFacetedFilter
          column={table.getColumn("flags")}
          title="Student Flags"
          options={availableFlags}
        />

        {isFiltered && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => table.resetColumnFilters()}
            className="flex h-8 items-center gap-2 text-muted-foreground"
          >
            <XCircleIcon className="h-4 w-4" />
            Reset
          </Button>
        )}
      </div>
    </div>
  );
}
