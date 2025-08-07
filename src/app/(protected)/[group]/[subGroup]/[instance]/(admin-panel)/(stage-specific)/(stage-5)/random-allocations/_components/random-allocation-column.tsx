"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { ShuffleIcon, Trash2Icon } from "lucide-react";
import Link from "next/link";

import { INSTITUTION } from "@/config/institution";
import { PAGES } from "@/config/pages";

import { type ProjectDTO, type StudentDTO } from "@/dto";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { DataTableColumnHeader } from "@/components/ui/data-table/data-table-column-header";
import { WithTooltip } from "@/components/ui/tooltip-wrapper";

import { cn } from "@/lib/utils";

type RandomAllocationDTO = { student: StudentDTO; project?: ProjectDTO };

export function useRandomAllocationColumns({
  getRandomAllocation,
  getRandomAllocationForAll,
  removeAllocation,
}: {
  getRandomAllocation: (studentId: string) => Promise<void>;
  getRandomAllocationForAll: () => Promise<void>;
  removeAllocation: (studentId: string) => Promise<void>;
}): ColumnDef<RandomAllocationDTO>[] {
  const columns: ColumnDef<RandomAllocationDTO>[] = [
    {
      id: "Random Allocation",
      header: () => {
        return (
          <WithTooltip tip="Randomly allocate a project to all student">
            <Button
              size="icon"
              variant="outline"
              onClick={async () => void getRandomAllocationForAll()}
            >
              <ShuffleIcon className="h-4 w-4" />
            </Button>
          </WithTooltip>
        );
      },
      cell: ({
        row: {
          original: { student },
        },
      }) => {
        return (
          <WithTooltip tip="Randomly allocate a project to this student">
            <Button
              size="icon"
              variant="outline"
              onClick={async () => void getRandomAllocation(student.id)}
            >
              <ShuffleIcon className="h-4 w-4" />
            </Button>
          </WithTooltip>
        );
      },
    },
    {
      id: `Student ${INSTITUTION.ID_NAME}`,
      accessorFn: (a) => a.student.id,
      header: ({ column }) => (
        <DataTableColumnHeader
          className="w-28"
          column={column}
          title={`Student ${INSTITUTION.ID_NAME}`}
        />
      ),
      cell: ({
        row: {
          original: { student },
        },
      }) => <p className="pl-3">{student.id}</p>,
    },
    {
      id: "Student Name",
      accessorFn: (a) => a.student.name,
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
      id: "Flag",
      accessorFn: (a) => a.student.flag.id,
      header: ({ column }) => (
        <DataTableColumnHeader className="w-16" column={column} title="Flag" />
      ),
      cell: ({
        row: {
          original: { student },
        },
      }) => (
        <p className="grid w-16 place-items-center">
          <Badge variant="outline" className="w-fit">
            {student.flag.displayName}
          </Badge>
        </p>
      ),
    },
    {
      id: "Allocated Project",
      accessorFn: (a) => a.student.name,
      header: () => <p className="w-60 text-wrap py-2">Allocated Project</p>,
      cell: ({
        row: {
          original: { project },
        },
      }) => {
        if (project) {
          return (
            <Link
              className={cn(
                buttonVariants({ variant: "link" }),
                "line-clamp-3 inline-block h-max w-60 pl-2 text-start",
              )}
              href={`./projects/${project.id}`}
              scroll={true}
            >
              {project.title}
            </Link>
          );
        }
      },
    },
    {
      id: "Remove Project",
      header: "",
      cell: ({
        row: {
          original: { project, student },
        },
      }) => {
        if (project) {
          return (
            <WithTooltip tip="Remove this project allocation">
              <Button
                size="icon"
                variant="destructive"
                onClick={async () => void removeAllocation(student.id)}
              >
                <Trash2Icon className="h-4 w-4" />
              </Button>
            </WithTooltip>
          );
        }
      },
    },
  ];

  return columns;
}
