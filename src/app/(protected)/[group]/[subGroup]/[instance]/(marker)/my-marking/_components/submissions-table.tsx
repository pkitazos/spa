"use client";

import { useState } from "react";
import {
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ChevronDown, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { columns, Project } from "./columns";

export function SubmissionsTable({ data }: { data: Project[] }) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

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
    getRowCanExpand: () => true,
    state: { sorting, columnFilters, columnVisibility, expanded },
    // @ts-ignore
    onExpandedChange: setExpanded,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center py-4">
        <Input
          placeholder="Filter projects..."
          value={
            (table.getColumn("projectName")?.getFilterValue() as string) ?? ""
          }
          onChange={(event) =>
            table.getColumn("projectName")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[30px]"></TableHead>
              <TableHead>Submission Title</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => {
                if (row.original.type === "project") {
                  return (
                    <ProjectRow
                      key={row.id}
                      row={row}
                      expanded={expanded}
                      onExpandedChange={setExpanded}
                    />
                  );
                }
                return null;
              })
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function ProjectRow({
  row,
  expanded,
  onExpandedChange,
}: {
  row: any;
  expanded: Record<string, boolean>;
  onExpandedChange: (expanded: Record<string, boolean>) => void;
}) {
  const isExpanded = expanded[row.original.id];

  return (
    <>
      <TableRow className="cursor-pointer hover:bg-muted/50">
        <TableCell>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 p-0"
            onClick={() => {
              onExpandedChange({ ...expanded, [row.original.id]: !isExpanded });
            }}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </TableCell>
        <TableCell colSpan={2}>
          <div className="font-medium">{row.original.projectName}</div>
          <div className="text-sm text-muted-foreground">
            Student: {row.original.studentName}
          </div>
        </TableCell>
        <TableCell colSpan={2}>{row.original.role}</TableCell>
      </TableRow>
      {isExpanded &&
        row.original.submissions.map((submission: any) => (
          <TableRow key={submission.id} className="bg-muted/30">
            <TableCell></TableCell>
            <TableCell>{submission.title}</TableCell>
            <TableCell>{submission.dueDate}</TableCell>
            <TableCell></TableCell>
            <TableCell>
              <SubmissionStatus status={submission.status} />
            </TableCell>
          </TableRow>
        ))}
    </>
  );
}

function SubmissionStatus({ status }: { status: string }) {
  switch (status) {
    case "mark":
      return (
        <Button size="sm" variant="secondary" className="w-24">
          Mark
        </Button>
      );
    case "edit":
      return (
        <Button size="sm" variant="secondary" className="w-24">
          Edit
        </Button>
      );
    case "submitted":
      return (
        <Button
          size="sm"
          variant="ghost"
          className="pointer-events-none w-24 text-muted-foreground"
        >
          Submitted
        </Button>
      );
    case "not_open":
      return (
        <Button
          size="sm"
          variant="ghost"
          className="pointer-events-none w-24 text-muted-foreground"
        >
          Not open
        </Button>
      );
    default:
      return null;
  }
}
