"use client";
import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { DataTableColumnHeader } from "@/components/ui/data-table/data-table-column-header";
import { WithTooltip } from "@/components/ui/tooltip-wrapper";

import { cn } from "@/lib/utils";
import { AllocationByStudentDto } from "@/lib/validations/allocation/data-table-dto";
import { PAGES } from "@/config/pages";

export const byStudentColumns: ColumnDef<AllocationByStudentDto>[] = [
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
      <DataTableColumnHeader column={column} title="Student Name" />
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
    id: "Student Email",
    accessorFn: ({ student }) => student.email,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Student Email" />
    ),
    cell: ({
      row: {
        original: { student },
      },
    }) => <p className="pl-3">{student.email}</p>,
  },
  {
    id: "Project Title",
    accessorFn: ({ project }) => project.id,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Project Title" />
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
            "inline-block w-40 truncate pl-2 text-start",
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
];
