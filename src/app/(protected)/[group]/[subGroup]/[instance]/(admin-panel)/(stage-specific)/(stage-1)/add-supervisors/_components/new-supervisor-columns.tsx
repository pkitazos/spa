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

import { type SupervisorDTO } from "@/dto";

import { Stage } from "@/db/types";

import { ConditionalRender } from "@/components/access-control";
import { FormatDenials } from "@/components/access-control/format-denial";
import {
  useInstanceStage,
  usePathInInstance,
} from "@/components/params-context";
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

import { previousStages, stageLte } from "@/lib/utils/permissions/stage-check";

export function useNewSupervisorColumns({
  deleteSupervisor,
  deleteManySupervisors,
}: {
  deleteSupervisor: (id: string) => Promise<void>;
  deleteManySupervisors: (ids: string[]) => Promise<void>;
}): ColumnDef<SupervisorDTO>[] {
  const stage = useInstanceStage();
  const { getInstancePath } = usePathInInstance();

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
                    void deleteManySupervisors(selectedSupervisorIds).then(() =>
                      table.toggleAllRowsSelected(false),
                    )
                  }
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
                    <ConditionalRender
                      allowedStages={previousStages(Stage.STUDENT_BIDDING)}
                      allowed={
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
                              <span>Remove selected Supervisors</span>
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
      cell: ({ row: { original: supervisor } }) => (
        <div className="flex w-14 items-center justify-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost">
                <span className="sr-only">Open menu</span>
                <MoreIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <YesNoActionContainer
              action={async () => void deleteSupervisor(supervisor.id)}
              title="Remove Supervisor?"
              description={`You are about to remove "${supervisor.name}" from the supervisor list. Do you wish to proceed?`}
            >
              <DropdownMenuContent align="center" side="bottom">
                <DropdownMenuLabel>
                  Actions
                  <span className="ml-2 text-muted-foreground">
                    for {supervisor.name}
                  </span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="group/item">
                  <Link
                    className="flex items-center gap-2 text-primary underline-offset-4 group-hover/item:underline hover:underline"
                    href={getInstancePath([
                      PAGES.allSupervisors.href,
                      supervisor.id,
                    ])}
                  >
                    <CornerDownRightIcon className="h-4 w-4" />
                    <span>View supervisor details</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="group/item">
                  <Link
                    className="flex items-center gap-2 text-primary underline-offset-4 group-hover/item:underline hover:underline"
                    href={getInstancePath(
                      [PAGES.allSupervisors.href, supervisor.id],
                      "edit=true",
                    )}
                  >
                    <PenIcon className="h-4 w-4" />
                    <span>Edit supervisor details</span>
                  </Link>
                </DropdownMenuItem>
                <ConditionalRender
                  allowedStages={previousStages(Stage.STUDENT_BIDDING)}
                  allowed={
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
                  }
                  denied={({ ctx, reasons }) => (
                    <WithTooltip
                      tip={<FormatDenials ctx={ctx} reasons={reasons} />}
                      forDisabled
                    >
                      <DropdownMenuItem
                        className="group/item2 text-destructive focus:bg-red-100/40 focus:text-destructive"
                        disabled
                      >
                        <button className="flex items-center gap-2">
                          <Trash2Icon className="h-4 w-4" />
                          <span>Remove from Instance</span>
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
