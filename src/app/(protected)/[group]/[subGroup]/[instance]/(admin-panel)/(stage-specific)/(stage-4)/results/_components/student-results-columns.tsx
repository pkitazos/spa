"use client";

import { type ColumnDef } from "@tanstack/react-table";
import Link from "next/link";

import { INSTITUTION } from "@/config/institution";
import { PAGES } from "@/config/pages";

import { type ProjectDTO, type StudentDTO } from "@/dto";

import { buttonVariants } from "@/components/ui/button";
import { DataTableColumnHeader } from "@/components/ui/data-table/data-table-column-header";
import { WithTooltip } from "@/components/ui/tooltip-wrapper";

export const studentResultsColumns: ColumnDef<{
  student: StudentDTO;
  project: ProjectDTO;
  studentRanking: number;
}>[] = [
  {
    id: INSTITUTION.ID_NAME,
    accessorFn: ({ student }) => student.id,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={INSTITUTION.ID_NAME} />
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
      <DataTableColumnHeader column={column} title="Student Name" />
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
      <DataTableColumnHeader column={column} title="Project ID" />
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
      <DataTableColumnHeader column={column} title="Project Title" />
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
