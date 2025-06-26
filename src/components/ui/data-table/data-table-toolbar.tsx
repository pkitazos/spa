"use client";

import { Table } from "@tanstack/react-table";
import { XCircleIcon } from "lucide-react";

import { SearchableColumn } from "@/lib/validations/table";

import { Button } from "../button";
import { Input } from "../input";

import { DataTableFacetedFilter } from "./data-table-faceted-filter";
import { DataTableViewOptions } from "./data-table-view-options";

export type TableFilterOption = { id: string; title: string };

export type TableFilter = {
  columnId: string;
  title?: string;
  options?: TableFilterOption[];
};

interface DataTableToolbarProps<TData> {
  searchableColumn?: SearchableColumn;
  data: TData[];
  table: Table<TData>;
  filters: TableFilter[];
}

export function DataTableToolbar<TData>({
  filters,
  searchableColumn,
  table,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;

  return (
    <div className="flex w-full items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        {searchableColumn && (
          <Input
            placeholder={`Search ${searchableColumn.displayName ?? ""}`}
            value={
              (table
                .getColumn(searchableColumn.id)
                ?.getFilterValue() as string) ?? ""
            }
            onChange={(event) =>
              table
                .getColumn(searchableColumn.id)
                ?.setFilterValue(event.target.value)
            }
            className="h-8 max-w-[150px] lg:max-w-[250px]"
          />
        )}

        {filters.map((filter) => {
          const column = table.getColumn(filter.columnId);
          if (!column) return null; // Handle potential invalid columnId

          const filterValues = filter.options
            ? filter.options
            : table
                .getCoreRowModel()
                .rows.map((row) => ({
                  id: row.id,
                  title: row.original[filter.columnId as keyof TData] as string,
                }));

          return (
            <DataTableFacetedFilter
              className="flex-none"
              key={filter.columnId}
              column={column}
              title={filter?.title ?? (column.columnDef.id as string)} // Assuming header is a string
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
