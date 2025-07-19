"use client";

import { type ColumnDef } from "@tanstack/react-table";
import {
  CornerDownRightIcon,
  MoreHorizontal as MoreIcon,
  PenIcon,
  Trash2Icon,
} from "lucide-react";
import Link from "next/link";

import { PAGES } from "@/config/pages";

import { type SupervisorDTO } from "@/dto";

import { Stage } from "@/db/types";

import { AccessControl } from "@/components/access-control";
import { useInstanceStage } from "@/components/params-context";
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

export function useNewSupervisorColumns({
  removeSupervisor,
  removeSelectedSupervisors,
}: {
  removeSupervisor: (id: string) => Promise<void>;
  removeSelectedSupervisors: (ids: string[]) => Promise<void>;
}): ColumnDef<SupervisorDTO>[] {
  const stage = useInstanceStage();

  const selectCol = getSelectColumn<SupervisorDTO>();

  const userCols: ColumnDef<SupervisorDTO>[] = [
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
      id: "GUID",
      accessorFn: ({ id }) => id,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="GUID" canFilter />
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
      id: "Target",
      accessorFn: ({ allocationTarget }) => allocationTarget,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Target" />
      ),
      cell: ({
        row: {
          original: { allocationTarget },
        },
      }) => <div className="text-center">{allocationTarget}</div>,
    },
    {
      id: "Upper Quota",
      accessorFn: ({ allocationUpperBound }) => allocationUpperBound,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Upper Quota" />
      ),
      cell: ({
        row: {
          original: { allocationUpperBound },
        },
      }) => <div className="text-center">{allocationUpperBound}</div>,
    },
    {
      accessorKey: "actions",
      id: "Actions",
      header: ({ table }) => {
        const someSelected =
          table.getIsAllPageRowsSelected() || table.getIsSomePageRowsSelected();

        const selectedSupervisorIds = table
          .getSelectedRowModel()
          .rows.map((e) => e.original.id);

        function handleRemoveSelectedSupervisors() {
          void removeSelectedSupervisors(selectedSupervisorIds).then(() =>
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
                  action={handleRemoveSelectedSupervisors}
                  title="Remove Supervisors?"
                  description={
                    selectedSupervisorIds.length === 1
                      ? `you are about to remove 1 supervisor from the list. Do you wish to proceed?`
                      : `You are about to remove ${selectedSupervisorIds.length} supervisors from the list. Do you wish to proceed?`
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
                            <span>Remove selected Supervisors</span>
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
              action={async () => void removeSupervisor(id)}
              title="Remove Supervisor?"
              description={`You are about to remove "${name}" from the supervisor list. Do you wish to proceed?`}
            >
              <DropdownMenuContent align="center" side="bottom">
                <DropdownMenuLabel>
                  Actions
                  <span className="ml-2 text-muted-foreground">for {name}</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="group/item">
                  <Link
                    className="flex items-center gap-2 text-primary underline-offset-4 group-hover/item:underline hover:underline"
                    href={`./${PAGES.allSupervisors.href}/${id}`}
                  >
                    <CornerDownRightIcon className="h-4 w-4" />
                    <span>View supervisor details</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="group/item">
                  <Link
                    className="flex items-center gap-2 text-primary underline-offset-4 group-hover/item:underline hover:underline"
                    href={`./${PAGES.allSupervisors.href}/${id}?edit=true`}
                  >
                    <PenIcon className="h-4 w-4" />
                    <span>Edit supervisor details</span>
                  </Link>
                </DropdownMenuItem>
                <AccessControl allowedStages={[Stage.SETUP]}>
                  <DropdownMenuItem className="text-destructive focus:bg-red-100/40 focus:text-destructive">
                    <YesNoActionTrigger
                      trigger={
                        <button className="flex items-center gap-2">
                          <Trash2Icon className="h-4 w-4" />
                          <span>Remove from Instance</span>
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
