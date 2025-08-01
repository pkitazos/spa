import { type ColumnDef } from "@tanstack/react-table";
import {
  CornerDownRightIcon,
  MoreHorizontalIcon as MoreIcon,
  PenIcon,
  Trash2Icon,
} from "lucide-react";
import Link from "next/link";
import { z } from "zod";

import { type ProjectDTO } from "@/dto";

import { useInstancePath } from "@/components/params-context";
import { tagTypeSchema } from "@/components/tag/tag-input";
import { Badge, badgeVariants } from "@/components/ui/badge";
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

export function useLateProjectColumns({
  deleteProject,
  deleteSelectedProjects,
}: {
  deleteProject: (id: string) => Promise<void>;
  deleteSelectedProjects: (ids: string[]) => Promise<void>;
}): ColumnDef<ProjectDTO>[] {
  const instancePath = useInstancePath();

  const selectCol = getSelectColumn<ProjectDTO>();

  const userCols: ColumnDef<ProjectDTO>[] = [
    {
      id: "ID",
      accessorFn: ({ id }) => id,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="ID" canFilter />
      ),
      cell: ({ row: { original: project } }) => (
        <WithTooltip
          align="start"
          tip={<div className="max-w-xs">{project.id}</div>}
        >
          <p className="w-28 truncate">{project.id}</p>
        </WithTooltip>
      ),
    },
    {
      id: "Project Title",
      accessorFn: ({ title }) => title,
      header: () => <div className="min-w-60 py-1 pl-4">Project Title</div>,
      cell: ({
        row: {
          original: { id, title },
        },
      }) => (
        <WithTooltip tip={<p className="w-96">{title}</p>}>
          <Link
            className={cn(
              buttonVariants({ variant: "link" }),
              "inline-block w-60 truncate px-0 text-start",
            )}
            href={`${instancePath}/projects/${id}`}
          >
            {title}
          </Link>
        </WithTooltip>
      ),
    },
    {
      id: "Supervisor GUID",
      accessorFn: ({ supervisorId }) => supervisorId,
      header: ({ column }) => (
        <div className="w-28 py-1">
          <DataTableColumnHeader column={column} title="Supervisor GUID" />
        </div>
      ),
      cell: ({
        row: {
          original: { supervisorId },
        },
      }) => <div className="w-28 py-1 pl-4">{supervisorId}</div>,
    },
    {
      id: "Flags",
      accessorFn: (row) => row.flags,
      header: () => <div className="text-center">Flags</div>,
      filterFn: (row, columnId, value) => {
        const ids = value as string[];
        const rowFlags = z.array(tagTypeSchema).parse(row.getValue(columnId));
        return rowFlags.some((e) => ids.includes(e.id));
      },
      cell: ({
        row: {
          original: { flags },
        },
      }) => (
        <div className="flex flex-col gap-2">
          {flags.length > 2 ? (
            <>
              <Badge className="w-fit" key={flags[0].id}>
                {flags[0].displayName}
              </Badge>
              <WithTooltip
                side="right"
                tip={
                  <ul className="flex list-disc flex-col gap-1 p-2 pl-1">
                    {flags.slice(1).map((flag) => (
                      <Badge className="w-max max-w-40" key={flag.id}>
                        {flag.displayName}
                      </Badge>
                    ))}
                  </ul>
                }
              >
                <div className={cn(badgeVariants(), "w-fit font-normal")}>
                  {flags.length - 1}+
                </div>
              </WithTooltip>
            </>
          ) : (
            flags.map((flag) => (
              <Badge className="w-max max-w-40" key={flag.id}>
                {flag.displayName}
              </Badge>
            ))
          )}
        </div>
      ),
    },
    {
      id: "Capacity Upper Bound",
      accessorFn: ({ capacityUpperBound }) => capacityUpperBound,
      header: ({ column }) => (
        <DataTableColumnHeader
          className="w-16"
          column={column}
          title="Upper Bound"
        />
      ),
      cell: ({
        row: {
          original: { capacityUpperBound },
        },
      }) => <div className="w-16 text-center">{capacityUpperBound}</div>,
    },
    {
      accessorKey: "actions",
      id: "Actions",
      header: ({ table }) => {
        const someSelected =
          table.getIsAllPageRowsSelected() || table.getIsSomePageRowsSelected();

        const selectedProjectIds = table
          .getSelectedRowModel()
          .rows.map((e) => e.original.id);

        async function handleDeleteSelected() {
          void deleteSelectedProjects(selectedProjectIds).then(() => {
            table.toggleAllRowsSelected(false);
          });
        }

        if (someSelected) {
          return (
            <div className="flex w-24 items-center justify-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="icon" variant="ghost">
                    <span className="sr-only">Open menu</span>
                    <MoreIcon className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <YesNoActionContainer
                  action={handleDeleteSelected}
                  title="Delete Projects?"
                  description={
                    selectedProjectIds.length === 1
                      ? `You are about to delete "${selectedProjectIds[0]}". Do you wish to proceed?`
                      : `You are about to delete ${selectedProjectIds.length} projects. Do you wish to proceed?`
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
                            <span>Delete Selected Projects</span>
                          </button>
                        }
                      />
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </YesNoActionContainer>
              </DropdownMenu>
            </div>
          );
        }
        return <ActionColumnLabel className="w-24" />;
      },
      cell: ({
        row: {
          original: { id, title },
        },
      }) => (
        <div className="flex w-24 items-center justify-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost">
                <span className="sr-only">Open menu</span>
                <MoreIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <YesNoActionContainer
              action={() => deleteProject(id)}
              title="Delete Project?"
              description={`You are about to delete project ${id}. Do you wish to proceed?`}
            >
              <DropdownMenuContent align="center" side="bottom">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="group/item">
                  <Link
                    className="flex items-center gap-2 text-primary underline-offset-4 group-hover/item:underline hover:underline"
                    href={`${instancePath}/projects/${id}`}
                  >
                    <CornerDownRightIcon className="h-4 w-4" />
                    <p className="flex items-center">
                      View &quot;
                      <p className="max-w-40 truncate">{title}</p>
                      &quot;
                    </p>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="group/item">
                  <Link
                    className="flex items-center gap-2 text-primary underline-offset-4 group-hover/item:underline hover:underline"
                    href={`${instancePath}/projects/${id}/edit`}
                  >
                    <PenIcon className="h-4 w-4" />
                    <span>Edit Project details</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive focus:bg-red-100/40 focus:text-destructive">
                  <YesNoActionTrigger
                    trigger={
                      <button className="flex items-center gap-2">
                        <Trash2Icon className="h-4 w-4" />
                        <span>Delete Project</span>
                      </button>
                    }
                  />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </YesNoActionContainer>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  return [selectCol, ...userCols];
}
