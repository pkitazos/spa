"use client";
import type { ColumnDef } from "@tanstack/react-table";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { cn } from "@/lib/utils";
import { SearchableColumn } from "@/lib/validations/table";

import { DataTablePagination } from "./data-table-pagination";
import { DataTableToolbar, TableFilter } from "./data-table-toolbar";
import {
  usePaginationSearchParams,
  useVisibilitySearchParams,
  useSortingSearchParams,
  useColumnFilterSearchParams,
  useGlobalFilterSearchParams,
} from "./hooks";
import { useRowSelectionSearchParams } from "./hooks/row-selection";

interface DataTableProps<TData, TValue> {
  className?: string;
  // @deprecated dont use this
  searchableColumn?: SearchableColumn; // <- this makes no sense
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  filters?: TableFilter[];
  removeRow?: () => void;
}

export default function DataTable<TData, TValue>({
  className,
  columns,
  data,
  filters = [],
  removeRow,
}: DataTableProps<TData, TValue>) {
  const [pagination, setPagination] = usePaginationSearchParams();
  const [columnVisibility, setColumnVisibility] =
    useVisibilitySearchParams(columns);

  const [sorting, setSorting] = useSortingSearchParams();

  const [columnFilters, setColumnFilters] =
    useColumnFilterSearchParams(columns);

  const [globalFilter, setGlobalFilter] = useGlobalFilterSearchParams();

  const [rowSelection, setRowSelection] = useRowSelectionSearchParams();

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),

    // Pagination [x]
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,

    // Col Visibility [x]
    onColumnVisibilityChange: setColumnVisibility,

    // Sorting [x]
    getSortedRowModel: getSortedRowModel(),
    enableMultiSort: false,
    onSortingChange: setSorting,

    // Col filtering [x]
    getFilteredRowModel: getFilteredRowModel(),
    onColumnFiltersChange: setColumnFilters,

    // Global filtering [x]
    onGlobalFilterChange: setGlobalFilter,

    // Row selection [ ]
    onRowSelectionChange: setRowSelection,
    state: {
      globalFilter,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination,
      sorting,
    },
    meta: { removeRow: removeRow },
  });

  return (
    <div className={cn(className)}>
      <div className="flex items-center gap-4 py-4">
        <DataTableToolbar data={data} filters={filters} table={table} />
      </div>
      <div className="w-full rounded-md border border-accent dark:border-slate-600">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No Results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          {table.getFooterGroups().length !== 0 && (
            <TableFooter>
              {table.getFooterGroups().map((footerGroup) => (
                <TableRow key={footerGroup.id}>
                  {footerGroup.headers.map((header) => (
                    <TableCell key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.footer,
                            header.getContext(),
                          )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableFooter>
          )}
        </Table>
      </div>
      <div className="flex w-full items-center justify-end space-x-2 py-4">
        <DataTablePagination table={table} />
      </div>
    </div>
  );
}
