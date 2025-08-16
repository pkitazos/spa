import { type ColumnDef } from "@tanstack/react-table";
import {
  CornerDownRightIcon,
  FilePlus2,
  LucideMoreHorizontal as MoreIcon,
  PenIcon,
  Trash2Icon,
} from "lucide-react";
import Link from "next/link";

import { INSTITUTION } from "@/config/institution";
import { PAGES } from "@/config/pages";

import { type SupervisorDTO } from "@/dto";

import { Role, Stage } from "@/db/types";

import { ConditionalRender } from "@/components/access-control";
import { FormatDenials } from "@/components/access-control/format-denial";
import {
  useInstanceStage,
  usePathInInstance,
} from "@/components/params-context";
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

import {
  previousStages,
  stageLt,
  stageLte,
} from "@/lib/utils/permissions/stage-check";

export function useAllSupervisorsColumns({
  roles,
  deleteSupervisor,
  deleteSelectedSupervisors,
}: {
  roles: Set<Role>;
  deleteSupervisor: (id: string) => Promise<void>;
  deleteSelectedSupervisors: (ids: string[]) => Promise<void>;
}): ColumnDef<SupervisorDTO>[] {
  const stage = useInstanceStage();
  const { getInstancePath } = usePathInInstance();

  const selectCol = getSelectColumn<SupervisorDTO>();

  const userCols: ColumnDef<SupervisorDTO>[] = [
    {
      id: INSTITUTION.ID_NAME,
      accessorFn: (s) => s.id,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={INSTITUTION.ID_NAME} />
      ),
      cell: ({ row: { original: supervisor } }) => (
        <WithTooltip
          align="start"
          tip={<div className="max-w-xs">{supervisor.id}</div>}
        >
          <div className="w-40 truncate">{supervisor.id}</div>
        </WithTooltip>
      ),
    },
    {
      id: "Name",
      accessorFn: (s) => s.name,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
      ),
      cell: ({ row: { original: supervisor } }) => (
        <Link
          className={buttonVariants({ variant: "link" })}
          href={getInstancePath([PAGES.allSupervisors.href, supervisor.id])}
        >
          {supervisor.name}
        </Link>
      ),
    },
    {
      id: "Email",
      accessorFn: (s) => s.email,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Email" />
      ),
    },
    {
      id: "Target",
      accessorFn: (s) => s.allocationTarget,
      header: ({ column }) => (
        <DataTableColumnHeader
          className="w-24"
          column={column}
          title="Target"
        />
      ),
      cell: ({ row: { original: s } }) => (
        <p className="w-24 text-center">{s.allocationTarget}</p>
      ),
    },
    {
      id: "Upper Quota",
      accessorFn: (s) => s.allocationUpperBound,
      header: ({ column }) => (
        <DataTableColumnHeader
          className="w-28"
          column={column}
          title="Upper Quota"
        />
      ),
      cell: ({ row: { original: s } }) => (
        <p className="w-28 text-center">{s.allocationUpperBound}</p>
      ),
    },
  ];

  const actionsCol: ColumnDef<SupervisorDTO> = {
    accessorKey: "actions",
    id: "Actions",
    header: ({ table }) => {
      const someSelected =
        table.getIsAllPageRowsSelected() || table.getIsSomePageRowsSelected();

      const selectedSupervisorIds = table
        .getSelectedRowModel()
        .rows.map((e) => e.original.id);

      if (
        someSelected &&
        roles.has(Role.ADMIN) &&
        stageLt(stage, Stage.PROJECT_ALLOCATION)
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
                  void deleteSelectedSupervisors(selectedSupervisorIds).then(
                    () => table.toggleAllRowsSelected(false),
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
                  <DropdownMenuItem className="group/item">
                    <Link
                      className="flex items-center gap-2 text-primary underline-offset-4 group-hover/item:underline hover:underline"
                      href={getInstancePath([
                        PAGES.allSupervisors.href,
                        supervisor.id,
                        PAGES.newProject.href,
                      ])}
                    >
                      <FilePlus2 className="h-4 w-4" />
                      <span>Create new project</span>
                    </Link>
                  </DropdownMenuItem>
                }
                denied={(denialData) => (
                  <WithTooltip
                    tip={
                      <FormatDenials
                        {...denialData}
                        action="Creating projects"
                      />
                    }
                    forDisabled
                  >
                    <DropdownMenuItem
                      className="group/item2 focus:bg-red-100/40 "
                      disabled
                    >
                      <button className="flex items-center gap-2 text-primary underline-offset-4 group-hover/item:underline hover:underline">
                        <FilePlus2 className="h-4 w-4" />
                        <span>Create new project</span>
                      </button>
                    </DropdownMenuItem>
                  </WithTooltip>
                )}
              />
              <ConditionalRender
                allowedStages={previousStages(Stage.STUDENT_BIDDING)}
                allowed={
                  <DropdownMenuItem className="group/item2 text-destructive focus:bg-red-100/40 focus:text-destructive">
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
                denied={(denialData) => (
                  <WithTooltip
                    tip={
                      <FormatDenials
                        {...denialData}
                        action="Removing supervisors"
                      />
                    }
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
  };

  if (!roles.has(Role.ADMIN)) return userCols;

  return stageLte(stage, Stage.STUDENT_BIDDING)
    ? [selectCol, ...userCols, actionsCol]
    : [...userCols, actionsCol];
}
