"use client";

import { type Table } from "@tanstack/react-table";
import { XCircleIcon } from "lucide-react";

import { Button } from "../button";
import { Input } from "../input";

import { DataTableFacetedFilter } from "./data-table-faceted-filter";
import { DataTableViewOptions } from "./data-table-view-options";

export type TableFilterOption = { id: string; displayName: string };

export type TableFilter = {
  columnId: string;
  title: string;
  options: TableFilterOption[];
};

interface DataTableToolbarProps<TData> {
  data: TData[];
  table: Table<TData>;
  filters: TableFilter[];
}

export function DataTableToolbar<TData>({
  filters,
  table,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;

  return (
    <div className="flex w-full items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        <Input
          placeholder="Search whole table"
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          value={table.getState().globalFilter}
          onChange={(event) => table.setGlobalFilter(event.target.value)}
          className="h-8 max-w-[150px] lg:max-w-[250px]"
        />

        {filters.map((filter) => {
          const column = table.getColumn(filter.columnId);
          if (!column) return null; // Handle potential invalid columnId

          const filterValues =
            filter.options ??
            table
              .getCoreRowModel()
              .rows.map((row) => ({
                id: row.id,
                displayName: row.original[
                  filter.columnId as keyof TData
                ] as string,
              }));

          return (
            <DataTableFacetedFilter
              className="flex-none"
              key={filter.columnId}
              column={column}
              title={filter?.title ?? column.columnDef.id!} // Assuming header is a string
              options={filterValues}
            />
          );
        })}

        {isFiltered && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => table.resetColumnFilters()}
            className="flex h-8 items-center gap-2 text-muted-foreground"
          >
            <XCircleIcon className="h-4 w-4" />
            <p>Reset</p>
          </Button>
        )}
      </div>
      <DataTableViewOptions table={table} />
    </div>
  );
}
