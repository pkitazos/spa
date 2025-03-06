"use client";
import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { DataTableColumnHeader } from "@/components/ui/data-table/data-table-column-header";
import { WithTooltip } from "@/components/ui/tooltip-wrapper";

import { cn } from "@/lib/utils";
import { AllocationBySupervisorDto } from "@/lib/validations/allocation/data-table-dto";
import { PAGES } from "@/config/pages";

export const bySupervisorColumns: ColumnDef<AllocationBySupervisorDto>[] = [
  {
    id: "Supervisor GUID",
    accessorFn: ({ supervisor }) => supervisor.id,
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Supervisor GUID"
        canFilter
      />
    ),
    cell: ({
      row: {
        original: { supervisor },
      },
    }) => <p className="pl-3 font-medium">{supervisor.id}</p>,
  },
  {
    id: "Supervisor Name",
    accessorFn: ({ supervisor }) => supervisor.name,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Supervisor Name" />
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
        href={`./${PAGES.allSupervisors.href}/${id}`}
        scroll={true}
      >
        {name}
      </Link>
    ),
  },
  {
    id: "Supervisor Email",
    accessorFn: ({ supervisor }) => supervisor.email,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Supervisor Email" />
    ),
  },
  {
    id: "Supervisor Lower Bound",
    accessorFn: ({ supervisor }) => supervisor.allocationLowerBound,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Supervisor Lower Bound" />
    ),
    cell: ({
      row: {
        original: {
          supervisor: { allocationLowerBound },
        },
      },
    }) => <div className="flex justify-center">{allocationLowerBound}</div>,
  },
  {
    id: "supervisor Target",
    accessorFn: ({ supervisor }) => supervisor.allocationTarget,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Supervisor Target" />
    ),
    cell: ({
      row: {
        original: {
          supervisor: { allocationTarget },
        },
      },
    }) => <div className="flex justify-center">{allocationTarget}</div>,
  },
  {
    id: "Supervisor Upper bound",
    accessorFn: ({ supervisor }) => supervisor.allocationUpperBound,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Supervisor Upper bound" />
    ),
    cell: ({
      row: {
        original: {
          supervisor: { allocationUpperBound },
        },
      },
    }) => <div className="flex justify-center">{allocationUpperBound}</div>,
  },
  {
    id: "Project Title",
    accessorFn: ({ project }) => project.title,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Project Title" canFilter />
    ),
    cell: ({
      row: {
        original: { project },
      },
    }) => (
      <WithTooltip tip={<p className="max-w-96">{project.title}</p>}>
        <Link
          className={cn(
            buttonVariants({ variant: "link" }),
            "inline-block w-40 truncate px-0 text-start",
          )}
          href={`./projects/${project.id}`}
          scroll={true}
        >
          {project.title}
        </Link>
      </WithTooltip>
    ),
  },
  {
    id: "Student GUID",
    accessorFn: ({ student }) => student.id,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Student GUID" canFilter />
    ),
    cell: ({
      row: {
        original: { student },
      },
    }) => <p className="pl-3 font-medium">{student.id}</p>,
  },
  {
    id: "Student Name",
    accessorFn: ({ student }) => student.name,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Student Name" canFilter />
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
        href={`./${PAGES.allStudents.href}/${id}`}
        scroll={true}
      >
        {name}
      </Link>
    ),
  },
  {
    id: "Student Ranking",
    accessorFn: ({ student }) => student.ranking,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Student Ranking" />
    ),
    cell: ({
      row: {
        original: { student },
      },
    }) => <div className="flex justify-center">{student.ranking}</div>,
  },
];
