"use client";
import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { DataTableColumnHeader } from "@/components/ui/data-table/data-table-column-header";
import { WithTooltip } from "@/components/ui/tooltip-wrapper";

import { ProjectDTO, StudentDTO } from "@/dto";
import { PAGES } from "@/config/pages";

export const studentResultsColumns: ColumnDef<{
  student: StudentDTO;
  project: ProjectDTO;
  studentRanking: number;
}>[] = [
  {
    id: "GUID",
    accessorFn: ({ student }) => student.id,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="GUID" canFilter />
    ),
    cell: ({
      row: {
        original: { student },
      },
    }) => <div>{student.id}</div>,
  },
  {
    id: "Student Name",
    accessorFn: ({ student }) => student.name,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Student Name" canFilter />
    ),
    cell: ({
      row: {
        original: { student },
      },
    }) => (
      <Link
        className={buttonVariants({ variant: "link" })}
        href={`./${PAGES.allStudents.href}/${student.id}`}
      >
        {student.name}
      </Link>
    ),
  },
  {
    id: "Project ID",
    accessorFn: ({ project }) => project.id,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Project ID" canFilter />
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
        <div className="w-40 truncate">{project.id}</div>
      </WithTooltip>
    ),
  },
  {
    id: "Project title",
    accessorFn: ({ project }) => project.title,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Project Title" canFilter />
    ),
    cell: ({
      row: {
        original: { project },
      },
    }) => (
      <Link
        className={buttonVariants({ variant: "link" })}
        href={`./projects/${project.id}`}
      >
        {project.title}
      </Link>
    ),
  },
  {
    id: "Student rank",
    accessorFn: ({ studentRanking }) => studentRanking,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Student Rank" />
    ),
    cell: ({
      row: {
        original: { studentRanking },
      },
    }) => (
      <div className="w-full text-center">
        {Number.isNaN(studentRanking) ? "-" : studentRanking}
      </div>
    ),
  },
];
