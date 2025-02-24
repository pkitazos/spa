import { Role, Stage } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";
import {
  CornerDownRightIcon,
  FilePlus2,
  LucideMoreHorizontal as MoreIcon,
  PenIcon,
  Trash2Icon,
} from "lucide-react";
import Link from "next/link";

import { AccessControl } from "@/components/access-control";
import { useInstanceStage } from "@/components/params-context";
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
import { SupervisorDto } from "@/lib/validations/dto/supervisor";

import { Role, Stage } from "@/db/types";

export function useAllSupervisorsColumns({
  role,
  deleteSupervisor,
  deleteSelectedSupervisors,
}: {
  role: Role;
  deleteSupervisor: (id: string) => Promise<void>;
  deleteSelectedSupervisors: (ids: string[]) => Promise<void>;
}): ColumnDef<SupervisorDto>[] {
  const stage = useInstanceStage();

  const selectCol = getSelectColumn<SupervisorDto>();

  const userCols: ColumnDef<SupervisorDto>[] = [
    {
      id: "GUID",
      accessorFn: (s) => s.id,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="GUID" canFilter />
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
      cell: ({
        row: {
          original: { id, name },
        },
      }) => (
        <Link
          className={buttonVariants({ variant: "link" })}
          href={`./supervisors/${id}`}
        >
          {name}
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
      accessorFn: (s) => s.projectTarget,
      header: ({ column }) => (
        <DataTableColumnHeader
          className="w-24"
          column={column}
          title="Target"
        />
      ),
      cell: ({ row: { original: s } }) => (
        <p className="w-24 text-center">{s.projectTarget}</p>
      ),
    },
    {
      id: "Upper Quota",
      accessorFn: (s) => s.projectUpperQuota,
      header: ({ column }) => (
        <DataTableColumnHeader
          className="w-28"
          column={column}
          title="Upper Quota"
        />
      ),
      cell: ({ row: { original: s } }) => (
        <p className="w-28 text-center">{s.projectUpperQuota}</p>
      ),
    },
  ];

  const actionsCol: ColumnDef<SupervisorDto> = {
    accessorKey: "actions",
    id: "Actions",
    header: ({ table }) => {
      const someSelected =
        table.getIsAllPageRowsSelected() || table.getIsSomePageRowsSelected();

      const selectedSupervisorIds = table
        .getSelectedRowModel()
        .rows.map((e) => e.original.id);

      function handleRemoveSelectedSupervisors() {
        void deleteSelectedSupervisors(selectedSupervisorIds).then(() =>
          table.toggleAllRowsSelected(false),
        );
      }

      if (
        someSelected &&
        role === Role.ADMIN &&
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
                  href={`./supervisors/${supervisor.id}`}
                >
                  <CornerDownRightIcon className="h-4 w-4" />
                  <span>View supervisor details</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="group/item">
                <Link
                  className="flex items-center gap-2 text-primary underline-offset-4 group-hover/item:underline hover:underline"
                  href={`./supervisors/${supervisor.id}?edit=true`}
                >
                  <PenIcon className="h-4 w-4" />
                  <span>Edit supervisor details</span>
                </Link>
              </DropdownMenuItem>
              <AccessControl
                allowedStages={previousStages(Stage.STUDENT_BIDDING)}
              >
                <DropdownMenuItem className="group/item">
                  <Link
                    className="flex items-center gap-2 text-primary underline-offset-4 group-hover/item:underline hover:underline"
                    href={`./supervisors/${supervisor.id}/new-project`}
                  >
                    <FilePlus2 className="h-4 w-4" />
                    <span>Create new project</span>
                  </Link>
                </DropdownMenuItem>
              </AccessControl>
              <AccessControl
                allowedRoles={[Role.ADMIN]}
                allowedStages={previousStages(Stage.STUDENT_BIDDING)}
              >
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
              </AccessControl>
            </DropdownMenuContent>
          </YesNoActionContainer>
        </DropdownMenu>
      </div>
    ),
  };

  if (role !== Role.ADMIN) return userCols;

  return stageLte(stage, Stage.STUDENT_BIDDING)
    ? [selectCol, ...userCols, actionsCol]
    : [...userCols, actionsCol];
}
