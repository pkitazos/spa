"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Button, buttonVariants } from "@/components/ui/button";
import { StatusIcon } from "./grades-table";
import { ProjectDTO, ReaderDTO, StudentDTO, SupervisorDTO } from "@/dto";
import { DataTableColumnHeader } from "@/components/ui/data-table/data-table-column-header";
import { WithTooltip } from "@/components/ui/tooltip-wrapper";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { PAGES } from "@/config/pages";
import { GradingResult } from "@/dto/result/grading-result";

// @JakeTrevor cook

export const columns: ColumnDef<{
  project: ProjectDTO;
  student: StudentDTO;
  supervisor: SupervisorDTO;
  supervisorGrade: string | undefined;
  reader: ReaderDTO;
  readerGrade: string | undefined;
  status: GradingResult;
  computedOverall: string | undefined;
  action?: string;
}>[] = [
  {
    id: "Project",
    accessorFn: (x) => x.project,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Project" />
    ),
    cell: ({
      row: {
        original: { project },
      },
    }) => (
      <WithTooltip
        align="start"
        tip={<div className="max-w-xs">{project.id}</div>}
      >
        <p className="max-w-28 truncate">{project.id}</p>
      </WithTooltip>
    ),
  },
  {
    id: "Student",
    accessorFn: ({ student }) => student.name,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Student" />
    ),
    cell: ({
      row: {
        original: {
          student: { id, name },
        },
      },
    }) => (
      <Link
        className={cn(buttonVariants({ variant: "link" }), "pl-2 text-left")}
        href={`../${PAGES.allStudents.href}/${id}`}
        scroll={true}
      >
        {name}
      </Link>
    ),
  },
  {
    id: "Supervisor",
    accessorFn: ({ supervisor }) => supervisor.name,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Supervisor" />
    ),
    cell: ({
      row: {
        original: {
          supervisor: { id, name },
        },
      },
    }) => (
      <Link
        className={cn(buttonVariants({ variant: "link" }), "pl-2 text-left")}
        href={`../${PAGES.allSupervisors.href}/${id}`}
        scroll={true}
      >
        {name}
      </Link>
    ),
  },
  { accessorKey: "supervisorGrade", header: "Supervisor Grade" },
  {
    id: "Reader",
    accessorFn: ({ reader }) => reader.name,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Reader" />
    ),
    cell: ({
      row: {
        original: {
          reader: { id, name },
        },
      },
    }) => (
      <Link
        className={cn(buttonVariants({ variant: "link" }), "pl-2 text-left")}
        // TODO: figure out what to do with readers who are not supervisors
        href={`./${PAGES.allSupervisors.href}/${id}`}
        scroll={true}
      >
        {name}
      </Link>
    ),
  },
  { accessorKey: "readerGrade", header: "Reader Grade" },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusIcon status={row.getValue("status")} />,
  },
  // TODO: make this sortable @lewismb27
  { accessorKey: "computedOverall", header: "Computed Overall" },
  {
    accessorKey: "action",
    header: "Action",
    cell: ({ row }) => {
      const action = row.getValue("action") as string;
      if (!action) return null;
      // Take to page to override grade

      // hide in more actions menu
      return (
        <Button variant="secondary" size="sm" className="w-32">
          {action}
        </Button>
      );
    },
  },
];
