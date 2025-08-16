"use client";

import { useState } from "react";

import {
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  type ProjectDTO,
  type ReaderDTO,
  type StudentDTO,
  type SupervisorDTO,
} from "@/dto";
import { GradingResult } from "@/dto/result/grading-result";

import { CircleCheckIcon } from "@/components/icons/circle-check";
import { CircleXIcon } from "@/components/icons/circle-x";
import { DataTablePagination } from "@/components/ui/data-table/data-table-pagination";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { columns } from "./grades-columns";

// @JakeTrevor cook
export function GradesTable({
  data,
}: {
  data: {
    project: ProjectDTO;
    student: StudentDTO;
    supervisor: SupervisorDTO;
    supervisorGrade: string | undefined;
    reader: ReaderDTO;
    readerGrade: string | undefined;
    status: GradingResult;
    computedOverall: string | undefined;
    action?: string;
  }[];
}) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: { sorting, columnFilters, columnVisibility },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center py-4">
        <Input
          placeholder="Filter projects..."
          value={(table.getColumn("project")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("project")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
      </div>
      <DataTablePagination table={table} />
      <ScrollArea className="w-full">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                      </TableHead>
                    );
                  })}
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
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </ScrollArea>
    </div>
  );
}

export function StatusIcon({ status }: { status: GradingResult }) {
  if (status === GradingResult.AUTO_RESOLVED) {
    return <CircleCheckIcon className="h-4 w-4 text-green-500" />;
  }
  if (status === GradingResult.MODERATE) {
    return <CircleXIcon className="h-4 w-4 text-red-500" />;
  }
  return null;
}
