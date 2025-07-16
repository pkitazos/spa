"use client";

import { type ColumnDef } from "@tanstack/react-table";
import {
  CornerDownRightIcon,
  LucideMoreHorizontal as MoreIcon,
  PenIcon,
  Trash2Icon,
} from "lucide-react";
import Link from "next/link";

import { PAGES } from "@/config/pages";

import { type ProjectDTO, type StudentDTO } from "@/dto";

import { Role, Stage } from "@/db/types";

import { AccessControl } from "@/components/access-control";
import { useInstanceStage } from "@/components/params-context";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { ActionColumnLabel } from "@/components/ui/data-table/action-column-label";
import { DataTableColumnHeader } from "@/components/ui/data-table/data-table-column-header";
import { getSelectColumn } from "@/components/ui/data-table/select-column";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { WithTooltip } from "@/components/ui/tooltip-wrapper";
import {
  YesNoActionContainer,
  YesNoActionTrigger,
} from "@/components/yes-no-action";

import { cn } from "@/lib/utils";
import {
  previousStages,
  stageGt,
  stageLte,
} from "@/lib/utils/permissions/stage-check";

type StudentWithAllocation = { student: StudentDTO; allocation?: ProjectDTO };

export function useAllStudentsColumns({
  roles,
  deleteStudent,
  deleteSelectedStudents,
}: {
  roles: Set<Role>;
  deleteStudent: (id: string) => Promise<void>;
  deleteSelectedStudents: (ids: string[]) => Promise<void>;
}): ColumnDef<StudentWithAllocation>[] {
  const stage = useInstanceStage();

  const selectCol = getSelectColumn<StudentWithAllocation>();

  const userCols: ColumnDef<StudentWithAllocation>[] = [
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
      }) => (
        <WithTooltip
          align="start"
          tip={<div className="max-w-xs">{student.id}</div>}
        >
          <div className="w-40 truncate">{student.id}</div>
        </WithTooltip>
      ),
    },
    {
      id: "Name",
      accessorFn: ({ student }) => student.name,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
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
      id: "Email",
      accessorFn: ({ student }) => student.email,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Email" />
      ),
    },
    {
      id: "Level",
      accessorFn: ({ student }) => student.level,
      header: ({ column }) => (
        <DataTableColumnHeader className="w-20" column={column} title="Level" />
      ),
      cell: ({
        row: {
          original: { student },
        },
      }) => (
        <div className="grid w-20 place-items-center">
          <Badge variant="accent">{student.level}</Badge>
        </div>
      ),
      filterFn: (row, columnId, value) => {
        const selectedFilters = value as ("4" | "5")[];
        const rowValue = row.getValue(columnId);
        console.log({ selectedFilters });
        const studentLevel = rowValue.toString() as "4" | "5";
        return selectedFilters.includes(studentLevel);
      },
    },
    {
      id: "Project Allocation",
      accessorFn: ({ allocation }) => allocation?.title,
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title="Project Allocation"
          canFilter
        />
      ),
      cell: ({
        row: {
          original: { allocation },
        },
      }) => {
        if (stageGt(stage, Stage.SETUP) && allocation) {
          return (
            <WithTooltip tip={<p className="max-w-96">{allocation.title}</p>}>
              <Link
                className={cn(
                  buttonVariants({ variant: "link" }),
                  "inline-block w-40 truncate px-0 text-start",
                )}
                href={`./projects/${allocation.id}`}
              >
                {allocation.title}
              </Link>
            </WithTooltip>
          );
        }
      },
    },
  ];

  const actionsCol: ColumnDef<StudentWithAllocation> = {
    accessorKey: "actions",
    id: "Actions",
    header: ({ table }) => {
      const someSelected =
        table.getIsAllPageRowsSelected() || table.getIsSomePageRowsSelected();

      const selectedStudentIds = table
        .getSelectedRowModel()
        .rows.map((e) => e.original.student.id);

      function handleRemoveSelectedStudents() {
        void deleteSelectedStudents(selectedStudentIds).then(() =>
          table.toggleAllRowsSelected(false),
        );
      }

      if (
        someSelected &&
        roles.has(Role.ADMIN) &&
        stageLte(stage, Stage.STUDENT_BIDDING)
      )
        return (
          <div className="flex w-14 items-center justify-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost">
                  <span className="sr-only">Open menu</span>
                  <MoreIcon className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <YesNoActionContainer
                action={handleRemoveSelectedStudents}
                title="Remove Students?"
                description={
                  selectedStudentIds.length === 1
                    ? `You are about to remove 1 student from the list. Do you wish to proceed?`
                    : `You are about to remove ${selectedStudentIds.length} students from the list. Do you wish to proceed?`
                }
              >
                <DropdownMenuContent align="center" side="bottom">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive focus:bg-red-100/40 focus:text-destructive">
                    <YesNoActionTrigger
                      trigger={
                        <button className="flex items-center gap-2">
                          <Trash2Icon className="h-4 w-4" />
                          <span>Remove selected Students</span>
                        </button>
                      }
                    />
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </YesNoActionContainer>
            </DropdownMenu>
          </div>
        );

      return <ActionColumnLabel />;
    },
    cell: ({
      row: {
        original: { student },
      },
    }) => (
      <div className="flex w-14 items-center justify-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreIcon className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <YesNoActionContainer
            action={async () => void deleteStudent(student.id)}
            title="Remove Student?"
            description={`You are about to remove "${student.name}" from the student list. Do you wish to proceed?`}
          >
            <DropdownMenuContent align="start" side="bottom">
              <DropdownMenuLabel>
                Actions
                <span className="ml-2 text-muted-foreground">
                  for {student.name}
                </span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="group/item">
                <Link
                  className="flex items-center gap-2 text-primary underline-offset-4 group-hover/item:underline hover:underline"
                  href={`./${PAGES.allStudents.href}/${student.id}`}
                >
                  <CornerDownRightIcon className="h-4 w-4" />
                  <span>View Student Details</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="group/item">
                <Link
                  className="flex items-center gap-2 text-primary underline-offset-4 group-hover/item:underline hover:underline"
                  href={`./${PAGES.allStudents.href}/${student.id}?edit=true`}
                >
                  <PenIcon className="h-4 w-4" />
                  <span>Edit student details</span>
                </Link>
              </DropdownMenuItem>
              <AccessControl
                allowedRoles={[Role.ADMIN]}
                allowedStages={previousStages(Stage.STUDENT_BIDDING)}
              >
                <DropdownMenuItem className="group/item2 text-destructive focus:bg-red-100/40 focus:text-destructive">
                  <YesNoActionTrigger
                    trigger={
                      <button className="flex items-center gap-2">
                        <Trash2Icon className="h-4 w-4" />
                        <span>Remove Student {student.name}</span>
                      </button>
                    }
                  />
                </DropdownMenuItem>
              </AccessControl>
            </DropdownMenuContent>
          </YesNoActionContainer>
        </DropdownMenu>
      </div>
    ),
  };

  if (!roles.has(Role.ADMIN)) return userCols;

  return stageLte(stage, Stage.STUDENT_BIDDING)
    ? [selectCol, ...userCols, actionsCol]
    : [...userCols, actionsCol];
}
