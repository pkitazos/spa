"use client";

import { type ColumnDef } from "@tanstack/react-table";
import {
  CornerDownRightIcon,
  MoreHorizontal as MoreIcon,
  PenIcon,
  Trash2Icon,
} from "lucide-react";
import Link from "next/link";

import { INSTITUTION } from "@/config/institution";
import { PAGES } from "@/config/pages";

import { type StudentDTO } from "@/dto";

import { Stage } from "@/db/types";

import { AccessControl } from "@/components/access-control";
import { useInstanceStage } from "@/components/params-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

export function useNewStudentColumns({
  removeStudent,
  removeSelectedStudents,
}: {
  removeStudent: (id: string) => Promise<void>;
  removeSelectedStudents: (ids: string[]) => Promise<void>;
}): ColumnDef<StudentDTO>[] {
  const stage = useInstanceStage();

  const selectCol = getSelectColumn<StudentDTO>();

  const userCols: ColumnDef<StudentDTO>[] = [
    {
      id: "Full Name",
      accessorFn: ({ name }) => name,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Full Name" />
      ),
      cell: ({
        row: {
          original: { name },
        },
      }) => (
        <WithTooltip align="start" tip={<div className="max-w-xs">{name}</div>}>
          <div className="w-40 truncate">{name}</div>
        </WithTooltip>
      ),
    },
    {
      id: INSTITUTION.ID_NAME,
      accessorFn: ({ id }) => id,
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={INSTITUTION.ID_NAME}
          canFilter
        />
      ),
      cell: ({
        row: {
          original: { id },
        },
      }) => (
        <WithTooltip align="start" tip={<div className="max-w-xs">{id}</div>}>
          <div className="w-32 truncate">{id}</div>
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
        <div className="grid w-28 place-items-center">
          <Badge variant="accent" className="rounded-md">
            {flag.displayName}
          </Badge>
        </div>
      ),
      filterFn: (row, columnId, value) => {
        const selectedFilters = value as string[];
        const rowValue = row.getValue<string>(columnId);
        return selectedFilters.includes(rowValue);
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

        function handleRemoveSelectedStudents() {
          void removeSelectedStudents(selectedStudentIds).then(() =>
            table.toggleAllRowsSelected(false),
          );
        }

        if (someSelected && stage === Stage.SETUP)
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
                          <button className="flex items-center gap-2 text-sm">
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
          original: { name, id },
        },
      }) => (
        <div className="flex w-14 items-center justify-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost">
                <span className="sr-only">Open menu</span>
                <MoreIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <YesNoActionContainer
              action={() => void removeStudent(id)}
              title="Remove Student?"
              description={`You are about to remove "${name}" from the student list. Do you wish to proceed?`}
            >
              <DropdownMenuContent align="center" side="bottom">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="group/item">
                  <Link
                    className="flex items-center gap-2 text-primary underline-offset-4 group-hover/item:underline hover:underline"
                    href={`./${PAGES.allStudents.href}/${id}`}
                  >
                    <CornerDownRightIcon className="h-4 w-4" />
                    <span>View student details</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="group/item">
                  <Link
                    className="flex items-center gap-2 text-primary underline-offset-4 group-hover/item:underline hover:underline"
                    href={`./${PAGES.allStudents.href}/${id}?edit=true`}
                  >
                    <PenIcon className="h-4 w-4" />
                    <span>Edit student details</span>
                  </Link>
                </DropdownMenuItem>
                <AccessControl allowedStages={[Stage.SETUP]}>
                  <DropdownMenuItem className="bg-background text-destructive focus:bg-red-100/40 focus:text-destructive">
                    <YesNoActionTrigger
                      trigger={
                        <button className="flex items-center gap-2 text-sm">
                          <Trash2Icon className="h-4 w-4" />
                          <span>Remove Student {name}</span>
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
    },
  ];

  return [selectCol, ...userCols];
}
