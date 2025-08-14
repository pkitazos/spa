"use client";

import { type ColumnDef } from "@tanstack/react-table";
import {
  CornerDownRightIcon,
  LucideMoreHorizontal as MoreIcon,
  Trash2Icon,
} from "lucide-react";
import Link from "next/link";
import { z } from "zod";

import { INSTITUTION } from "@/config/institution";
import { PAGES } from "@/config/pages";

import { type ProjectDTO, type StudentDTO } from "@/dto";

import { Role, Stage } from "@/db/types";

import {
  ConditionalRender,
  ConditionalRenderSimple,
} from "@/components/access-control";
import { FormatDenial } from "@/components/access-control/format-denial";
import {
  useInstanceStage,
  usePathInInstance,
} from "@/components/params-context";
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
  const { getInstancePath } = usePathInInstance();

  const selectCol = getSelectColumn<StudentWithAllocation>();

  const userCols: ColumnDef<StudentWithAllocation>[] = [
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
      }) => (
        <WithTooltip
          align="start"
          tip={<div className="max-w-xs">{student.id}</div>}
        >
          <div className="w-20 truncate">{student.id}</div>
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
          href={getInstancePath([PAGES.allStudents.href, student.id])}
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
      id: "Flag",
      accessorFn: ({ student }) => student.flag.displayName,
      header: ({ column }) => (
        <DataTableColumnHeader className="w-20" column={column} title="Flag" />
      ),
      cell: ({
        row: {
          original: { student },
        },
      }) => (
        <div className="grid w-40 place-items-center">
          <Badge variant="accent" className="rounded-md">
            {student.flag.displayName}
          </Badge>
        </div>
      ),
      filterFn: (row, columnId, value) => {
        const selectedFilters = z.array(z.string()).parse(value);
        return selectedFilters.includes(row.getValue<string>(columnId));
      },
    },
    {
      id: "Project Allocation",
      accessorFn: ({ allocation }) => allocation?.title,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Project Allocation" />
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
                href={getInstancePath([PAGES.allProjects.href, allocation.id])}
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
                action={async () =>
                  void deleteSelectedStudents(selectedStudentIds).then(() =>
                    table.toggleAllRowsSelected(false),
                  )
                }
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
                  <ConditionalRenderSimple
                    allowedStages={previousStages(Stage.STUDENT_BIDDING)}
                  >
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
                  </ConditionalRenderSimple>
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
                  href={getInstancePath([PAGES.allStudents.href, student.id])}
                >
                  <CornerDownRightIcon className="h-4 w-4" />
                  <span>View Student Details</span>
                </Link>
              </DropdownMenuItem>
              <ConditionalRender
                allowedStages={previousStages(Stage.STUDENT_BIDDING)}
                components={{
                  allowed: (
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
                  ),
                  denied: (data) => (
                    <WithTooltip
                      tip={
                        <p className="max-w-xl">
                          {data.reasons.map((reason, i) => (
                            <FormatDenial
                              key={i}
                              ctx={data.ctx}
                              reason={reason}
                            />
                          ))}
                        </p>
                      }
                      forDisabled
                    >
                      <DropdownMenuItem
                        className="group/item2 text-destructive focus:bg-red-100/40 focus:text-destructive"
                        disabled
                      >
                        <button className="flex items-center gap-2">
                          <Trash2Icon className="h-4 w-4" />
                          <span>Remove Student {student.name}</span>
                        </button>
                      </DropdownMenuItem>
                    </WithTooltip>
                  ),
                }}
              ></ConditionalRender>
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
