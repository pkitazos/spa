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
import { SaveAll } from "lucide-react";
import { AlertTriangle, Info } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DataTablePagination } from "@/components/ui/data-table/data-table-pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { cn } from "@/lib/utils";

import { useManualAllocationColumns } from "./manual-allocation-columns";
import { ManualAllocationToolbar } from "./manual-allocation-toolbar";
import {
  type ManualAllocationProject,
  type ManualAllocationStudent,
  type ManualAllocationSupervisor,
  ValidationWarningSeverity,
} from "./manual-allocation-types";

type ManualAllocationDataTableProps = {
  students: ManualAllocationStudent[];
  projects: ManualAllocationProject[];
  supervisors: ManualAllocationSupervisor[];

  onUpdateAllocation: (
    studentId: string,
    { projectId, supervisorId }: { projectId?: string; supervisorId?: string },
  ) => void;
  onRemoveAllocation: (studentId: string) => void;
  onSave: (studentId: string) => Promise<void>;
  onSaveAll: () => Promise<void>;
  onReset: (studentId: string) => void;
};

export function ManualAllocationDataTable({
  students,
  projects,
  supervisors,
  onUpdateAllocation,
  onRemoveAllocation,
  onSave,
  onSaveAll,
  onReset,
}: ManualAllocationDataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

  const columns = useManualAllocationColumns({
    projects,
    supervisors,
    onUpdateAllocation,
    onRemoveAllocation,
    onSave,
    onReset,
  });

  const table = useReactTable({
    data: students,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: { sorting, columnFilters, columnVisibility, rowSelection },
  });

  const hasChanges = students.some((s) => s.isDirty);
  const dirtyCount = students.filter((s) => s.isDirty).length;

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <ManualAllocationToolbar table={table} students={students} />
        <Button
          onClick={onSaveAll}
          disabled={!hasChanges}
          className="flex w-64 items-center gap-2"
        >
          <SaveAll className="h-4 w-4" />
          Save All Changes ({dirtyCount})
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="px-4 py-3">
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
              table.getRowModel().rows.map((row) => {
                const student = row.original;
                const hasWarnings = student.warnings.length > 0;

                return (
                  <>
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                      className={cn(
                        "transition-colors",
                        student.isDirty ? "bg-blue-50/50" : "hover:bg-muted/50",
                        hasWarnings ? "border-b-0" : "border-b",
                      )}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="px-4 py-4">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </TableCell>
                      ))}
                    </TableRow>

                    {hasWarnings && (
                      <TableRow
                        className={cn(
                          "border-b",
                          student.isDirty ? "bg-blue-50/30" : "bg-gray-50/50",
                        )}
                      >
                        <TableCell
                          colSpan={columns.length}
                          className="px-4 py-3"
                        >
                          <WarningsDisplay warnings={student.warnings} />
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                );
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No students found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <DataTablePagination table={table} />
    </div>
  );
}

function WarningsDisplay({
  warnings,
}: {
  warnings: ManualAllocationStudent["warnings"];
}) {
  const errorWarnings = warnings.filter(
    (w) => w.severity === ValidationWarningSeverity.ERROR,
  );
  const warningMessages = warnings.filter(
    (w) => w.severity === ValidationWarningSeverity.WARNING,
  );

  return (
    <div className="space-y-2">
      {errorWarnings.length > 0 && (
        <div className="space-y-2">
          {errorWarnings.map((warning, index) => (
            <div
              key={index}
              className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
              <span className="text-sm text-red-800">{warning.message}</span>
            </div>
          ))}
        </div>
      )}

      {warningMessages.length > 0 && (
        <div className="space-y-2">
          {warningMessages.map((warning, index) => (
            <div
              key={index}
              className="flex items-start gap-2 rounded-md border border-orange-200 bg-orange-50 p-3"
            >
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-orange-600" />
              <span className="text-sm text-orange-800">{warning.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
