"use client";

import { type ColumnDef } from "@tanstack/react-table";
import {
  CornerDownRightIcon,
  MoreHorizontal as MoreIcon,
  Trash2Icon,
} from "lucide-react";
import Link from "next/link";
import { z } from "zod";

import { INSTITUTION } from "@/config/institution";
import { PAGES } from "@/config/pages";

import { type StudentDTO } from "@/dto";

import { Stage } from "@/db/types";

import { ConditionalRender } from "@/components/access-control";
import { FormatDenials } from "@/components/access-control/format-denial";
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

import { previousStages, stageLte } from "@/lib/utils/permissions/stage-check";

export function useNewStudentColumns({
  deleteStudent,
  deleteManyStudents,
}: {
  deleteStudent: (id: string) => Promise<void>;
  deleteManyStudents: (ids: string[]) => Promise<void>;
}): ColumnDef<StudentDTO>[] {
  const stage = useInstanceStage();
  const { getInstancePath } = usePathInInstance();

  const selectCol = getSelectColumn<StudentDTO>();

  const userCols: ColumnDef<StudentDTO>[] = [
    {
      id: "Full Name",
      accessorFn: ({ name }) => name,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Full Name" />
      ),
      cell: ({ row: { original: student } }) => (
        <WithTooltip
          align="start"
          tip={<div className="max-w-xs">{student.name}</div>}
        >
          <Link
            className={buttonVariants({ variant: "link" })}
            href={getInstancePath([PAGES.allStudents.href, student.id])}
          >
            {student.name}
          </Link>
        </WithTooltip>
      ),
    },
    {
      id: INSTITUTION.ID_NAME,
      accessorFn: ({ id }) => id,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={INSTITUTION.ID_NAME} />
      ),
      cell: ({
        row: {
          original: { id },
        },
      }) => (
        <WithTooltip tip={<div className="max-w-xs">{id}</div>}>
          <div className="w-20 truncate">{id}</div>
        </WithTooltip>
      ),
    },
    {
      id: "Email",
      accessorFn: ({ email }) => email,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Email" />
      ),
    },
    {
      id: "Flag",
      accessorFn: ({ flag }) => flag.displayName,
      header: ({ column }) => (
        <DataTableColumnHeader className="w-28" column={column} title="Flag" />
      ),
      cell: ({
        row: {
          original: { flag },
        },
      }) => (
        <div className="grid w-40 place-items-center">
          <Badge variant="accent" className="rounded-md">
            {flag.displayName}
          </Badge>
        </div>
      ),
      filterFn: (row, columnId, value) => {
        const selectedFilters = z.array(z.string()).parse(value);
        return selectedFilters.includes(row.getValue<string>(columnId));
      },
    },
    {
      accessorKey: "actions",
      id: "Actions",
      header: ({ table }) => {
        const someSelected =
          table.getIsAllPageRowsSelected() || table.getIsSomePageRowsSelected();

        const selectedStudentIds = table
          .getSelectedRowModel()
          .rows.map((e) => e.original.id);

        if (someSelected && stageLte(stage, Stage.STUDENT_BIDDING))
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
                    void deleteManyStudents(selectedStudentIds).then(() =>
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
                    <ConditionalRender
                      allowedStages={previousStages(Stage.STUDENT_BIDDING)}
                      allowed={
                        <DropdownMenuItem className="text-destructive focus:bg-red-100/40 focus:text-destructive">
                          <YesNoActionTrigger
                            trigger={
                              <button className="flex items-center gap-2 text-sm">
                                <Trash2Icon className="h-4 w-4" />
                                <span>Remove selected Students</span>
                              </button>
                            }
                          />
                        </DropdownMenuItem>
                      }
                      denied={({ ctx, reasons }) => (
                        <WithTooltip
                          forDisabled
                          tip={<FormatDenials ctx={ctx} reasons={reasons} />}
                        >
                          <DropdownMenuItem
                            className="text-destructive focus:bg-red-100/40 focus:text-destructive"
                            disabled
                          >
                            <button className="flex items-center gap-2 text-sm">
                              <Trash2Icon className="h-4 w-4" />
                              <span>Remove selected Students</span>
                            </button>
                          </DropdownMenuItem>
                        </WithTooltip>
                      )}
                    />
                  </DropdownMenuContent>
                </YesNoActionContainer>
              </DropdownMenu>
            </div>
          );

        return <ActionColumnLabel />;
      },
      cell: ({ row: { original: student } }) => (
        <div className="flex w-14 items-center justify-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost">
                <span className="sr-only">Open menu</span>
                <MoreIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <YesNoActionContainer
              action={async () => void deleteStudent(student.id)}
              title="Remove Student?"
              description={`You are about to remove "${student.name}" from the student list. Do you wish to proceed?`}
            >
              <DropdownMenuContent align="center" side="bottom">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="group/item">
                  <Link
                    className="flex items-center gap-2 text-primary underline-offset-4 group-hover/item:underline hover:underline"
                    href={getInstancePath([PAGES.allStudents.href, student.id])}
                  >
                    <CornerDownRightIcon className="h-4 w-4" />
                    <span>View student details</span>
                  </Link>
                </DropdownMenuItem>
                <ConditionalRender
                  allowedStages={previousStages(Stage.STUDENT_BIDDING)}
                  allowed={
                    <DropdownMenuItem className="bg-background text-destructive focus:bg-red-100/40 focus:text-destructive">
                      <YesNoActionTrigger
                        trigger={
                          <button className="flex items-center gap-2 text-sm">
                            <Trash2Icon className="h-4 w-4" />
                            <span>Remove Student {student.name}</span>
                          </button>
                        }
                      />
                    </DropdownMenuItem>
                  }
                  denied={({ ctx, reasons }) => (
                    <WithTooltip
                      forDisabled
                      tip={<FormatDenials ctx={ctx} reasons={reasons} />}
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
                  )}
                />
              </DropdownMenuContent>
            </YesNoActionContainer>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  return [selectCol, ...userCols];
}
