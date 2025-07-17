import { type ColumnDef } from "@tanstack/react-table";

import { buttonVariants } from "@/components/ui/button";
import { DataTableColumnHeader } from "@/components/ui/data-table/data-table-column-header";
import { WithTooltip } from "@/components/ui/tooltip-wrapper";

import { type AllocationCsvData } from "@/lib/validations/allocation-csv-data";

export const columns: ColumnDef<AllocationCsvData>[] = [
  {
    id: "Project ID",
    accessorFn: (row) => row.project.id,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Project ID" canFilter />
    ),
    cell: ({
      row: {
        original: { project },
      },
    }) => (
      <div className="flex w-32 items-center justify-center">
        <WithTooltip tip={project.id} duration={500}>
          <p className={buttonVariants({ variant: "ghost" })}>{project.id}</p>
        </WithTooltip>
      </div>
    ),
  },
  {
    id: "Student GUID",
    accessorFn: (row) => row.student.id,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Student GUID" canFilter />
    ),
    cell: ({
      row: {
        original: { student },
      },
    }) => (
      <div className="flex w-32 items-center justify-center">
        <WithTooltip tip={student.id} duration={500}>
          <p className={buttonVariants({ variant: "ghost" })}>{student.id}</p>
        </WithTooltip>
      </div>
    ),
  },
  {
    id: "Student Name",
    accessorFn: (row) => row.student.name,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Student Name" canFilter />
    ),
    cell: ({
      row: {
        original: { student },
      },
    }) => (
      <div className="flex w-32 items-center justify-center">
        <WithTooltip tip={student.name} duration={500}>
          <p className={buttonVariants({ variant: "ghost" })}>{student.name}</p>
        </WithTooltip>
      </div>
    ),
  },
  {
    id: "Student Matric.",
    accessorFn: (row) => row.student.matric,
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Student Matric."
        canFilter
      />
    ),
    cell: ({
      row: {
        original: { student },
      },
    }) => (
      <div className="flex w-32 items-center justify-center">
        <WithTooltip tip={student.matric} duration={500}>
          <p className={buttonVariants({ variant: "ghost" })}>
            {student.matric}
          </p>
        </WithTooltip>
      </div>
    ),
  },
  {
    id: "Student Email",
    accessorFn: (row) => row.student.email,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Student Email" />
    ),
    cell: ({
      row: {
        original: { student },
      },
    }) => <p className="text-center">{student.email}</p>,
  },
  {
    id: "Student Level",
    accessorFn: (row) => row.student.level,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Student Level" />
    ),
    cell: ({
      row: {
        original: { student },
      },
    }) => <div className="text-center">{student.level}</div>,
  },
  {
    id: "Project Title",
    accessorFn: (row) => row.project.title,
    header: () => <div className="w-32 py-1">Project Title</div>,
  },
  {
    id: "Project Description",
    accessorFn: (row) => row.project.description,
    header: () => <div className="w-60 py-1">Project Description</div>,
    cell: ({
      row: {
        original: { project },
      },
    }) => <p className="line-clamp-6">{project.description}</p>,
  },
  {
    id: "Project Special Technical Requirements",
    accessorFn: (row) => row.project.specialTechnicalRequirements,
    header: () => (
      <div className="w-40 py-1">Project Special Technical Requirements</div>
    ),
    cell: ({
      row: {
        original: { project },
      },
    }) => (
      <p className="line-clamp-6">{project.specialTechnicalRequirements}</p>
    ),
  },
  {
    id: "Student Ranking",
    accessorFn: (row) => row.student.ranking,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Student Ranking" />
    ),
    cell: ({
      row: {
        original: { student },
      },
    }) => <p className="text-center">{student.ranking}</p>,
  },
  {
    id: "Supervisor GUID",
    accessorFn: (row) => row.supervisor.id,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Supervisor GUID" />
    ),
    cell: ({
      row: {
        original: { supervisor },
      },
    }) => <p className="text-center">{supervisor.id}</p>,
  },
  {
    id: "Supervisor Name",
    accessorFn: (row) => row.supervisor.id,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Supervisor Name" />
    ),
    cell: ({
      row: {
        original: { supervisor },
      },
    }) => <p className="text-center">{supervisor.name}</p>,
  },
  {
    id: "Supervisor Email",
    accessorFn: (row) => row.supervisor.email,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Supervisor Email" />
    ),
    cell: ({
      row: {
        original: { supervisor },
      },
    }) => <p className="text-center">{supervisor.email}</p>,
  },
];
