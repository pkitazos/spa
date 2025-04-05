"use client";

import { useState } from "react";
import {
  type ColumnFiltersState,
  ExpandedState,
  Row,
  type SortingState,
  type VisibilityState,
  getCoreRowModel,
  getFilteredRowModel,
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
import { columns, SubmissionTableRow } from "./columns";
import Link from "next/link";
import { PAGES } from "@/config/pages";
import { MarkerType } from "@prisma/client";
import { UnitOfAssessmentDTO } from "@/dto";
import { format } from "@/lib/utils/date/format";
import { CopyButton } from "@/components/copy-button";

export function SubmissionsTable({ data }: { data: SubmissionTableRow[] }) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [expanded, setExpanded] = useState<ExpandedState>({});

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    getRowCanExpand: () => true,
    onExpandedChange: setExpanded,
    state: { sorting, columnFilters, columnVisibility, expanded },
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
              <TableHead>Level</TableHead>
              <TableHead>Role</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table
                .getRowModel()
                .rows.map((row) => <ProjectRow key={row.id} row={row} />)
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

function ProjectRow({ row }: { row: Row<SubmissionTableRow> }) {
  const isExpanded = row.getIsExpanded();
  return (
    <>
      <TableRow className="cursor-pointer hover:bg-muted/50">
        <TableCell>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 p-0"
            onClick={() => row.toggleExpanded()}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </TableCell>
        <TableCell colSpan={2}>
          <div className="font-medium">{row.original.project.title}</div>
          <div className="text-sm text-muted-foreground">
            Student: {row.original.student.name} ({row.original.student.id}{" "}
            <CopyButton data={row.original.student.id} message="student ID" />)
          </div>
        </TableCell>
        <TableCell colSpan={1}>{row.original.student.level}</TableCell>
        <TableCell colSpan={2}>
          {row.original.markerType === MarkerType.SUPERVISOR
            ? "Supervisor"
            : "Reader"}
        </TableCell>
      </TableRow>
      {isExpanded &&
        row.original.unitsOfAssessment.map((data) => (
          <AssessmentUnitRow data={data} studentId={row.original.student.id} />
        ))}
    </>
  );
}
function AssessmentUnitRow({
  data,
  studentId,
}: {
  data: { unit: UnitOfAssessmentDTO; isSaved: boolean; isSubmitted: boolean };
  studentId: string;
}) {
  return (
    <TableRow key={data.unit.id} className="bg-muted/30">
      <TableCell></TableCell>
      <TableCell>{data.unit.title}</TableCell>
      <TableCell>{format(data.unit.markerSubmissionDeadline)}</TableCell>
      <TableCell />
      <TableCell>
        <SubmissionStatus
          status={computeStatus(data)}
          unitId={data.unit.id}
          studentId={studentId}
        />
      </TableCell>
    </TableRow>
  );
}

function computeStatus({
  unit,
  isSaved,
  isSubmitted,
}: {
  unit: UnitOfAssessmentDTO;
  isSaved: boolean;
  isSubmitted: boolean;
}): submissionStatus {
  if (isSubmitted) return submissionStatus.SUBMITTED;
  if (isSaved) return submissionStatus.DRAFT;
  if (!unit.isOpen) return submissionStatus.CLOSED;
  return submissionStatus.OPEN;
}

enum submissionStatus {
  CLOSED,
  OPEN,
  DRAFT,
  SUBMITTED,
}

function SubmissionStatus({
  status,
  unitId,
  studentId,
}: {
  status: submissionStatus;
  unitId: string;
  studentId: string;
}) {
  switch (status) {
    case submissionStatus.OPEN:
      return (
        <Button size="sm" variant="secondary" className="w-24" asChild>
          <Link href={`./${PAGES.myMarking.href}/${unitId}/${studentId}`}>
            Mark
          </Link>
        </Button>
      );
    case submissionStatus.DRAFT:
      return (
        <Button size="sm" variant="secondary" className="w-24" asChild>
          <Link href={`./${PAGES.myMarking.href}/${unitId}/${studentId}`}>
            Edit
          </Link>
        </Button>
      );
    case submissionStatus.SUBMITTED:
      return (
        <Button
          size="sm"
          variant="ghost"
          className="pointer-events-none w-24 text-muted-foreground"
        >
          Submitted
        </Button>
      );
    case submissionStatus.CLOSED:
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
