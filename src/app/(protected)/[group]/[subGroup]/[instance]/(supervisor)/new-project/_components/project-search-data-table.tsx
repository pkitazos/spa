"use client";

import { useState } from "react";

import {
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table";
import { Search, XIcon } from "lucide-react";

import { type InstanceDTO, type ProjectDTO, type SupervisorDTO } from "@/dto";

import { Button } from "@/components/ui/button";
import { type TableFilter } from "@/components/ui/data-table/data-table-toolbar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  Table,
} from "@/components/ui/table";

import { cn } from "@/lib/utils";

import { useProjectSearchColumns } from "./project-search-columns";
import { globalContains, hasSome } from "./utils";

export default function ProjectSearchDataTable({
  data,
  className,
  filters,
}: {
  data: {
    instanceData: InstanceDTO;
    project: ProjectDTO;
    supervisor: SupervisorDTO;
  }[];
  className?: string;
  filters: TableFilter[];
}) {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [open, setOpen] = useState(false);

  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility] = useState<VisibilityState>({ instance: false });

  const columns = useProjectSearchColumns();

  const table = useReactTable({
    data,
    columns,
    state: { globalFilter: debounced, columnFilters, columnVisibility },
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: globalContains,
    filterFns: { hasSome, globalContains },
    enableGlobalFilter: true,
  });

  const rowModel = table.getRowModel();
  const rows = rowModel.rows;

  return (
    <div className={cn("w-full space-y-6", className)}>
      {/* Global Search */}
      <div className="relative">
        <Label htmlFor="global-search" className="sr-only">
          Search Projects
        </Label>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id="global-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search projects, supervisors, instances..."
          className="h-12 rounded-md pl-10"
          aria-label="Global search across all columns"
        />
        {query.length > 0 && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2"
            aria-label="Clear search"
            onClick={() => setQuery("")}
          >
            <XIcon className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Data Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id} className="bg-muted/30">
                {hg.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={cn(
                      "text-lg font-semibold",
                      header.column.id === "supervisor" && "w-[36%]",
                    )}
                  >
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
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={2}>
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Search className="mb-2 h-5 w-5 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      No results. Try adjusting your search or filters.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        "align-top",
                        cell.column.id === "supervisor" && "md:border-l",
                      )}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
