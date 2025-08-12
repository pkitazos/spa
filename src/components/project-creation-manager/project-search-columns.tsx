import { useMemo } from "react";

import { type ColumnDef } from "@tanstack/react-table";
import { Copy } from "lucide-react";

import { spacesLabels } from "@/config/spaces";

import { Role } from "@/db/types";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTableColumnHeader } from "@/components/ui/data-table/data-table-column-header";

import { hasSome } from "./utils";

import { type ProjectSearchData } from ".";

export function useProjectSearchColumns({
  userRole,
  onProjectSelect,
}: {
  userRole: Role;
  onProjectSelect: (data: ProjectSearchData) => void;
}) {
  return useMemo<ColumnDef<ProjectSearchData>[]>(() => {
    const projectColumns = [
      {
        id: "project",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Project" />
        ),
        accessorFn: (row) => `${row.project.title} ${row.project.description}`,
        enableGlobalFilter: true,
        cell: ({ row }) => {
          const { project, instanceData } = row.original;
          return (
            <div className="space-y-3 py-1">
              <div className="text-base font-medium leading-snug">
                {project.title}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">
                  {spacesLabels.instance.short}:
                </span>
                <Badge variant="secondary">{instanceData.displayName}</Badge>
              </div>
              <div className="flex items-center gap-2">
                {project.flags.map((flag) => (
                  <Badge key={flag.id} variant="accent">
                    {flag.displayName}
                  </Badge>
                ))}
              </div>
              <div className="flex items-center gap-2">
                {project.tags.map((tag) => (
                  <Badge key={tag.id} variant="outline">
                    {tag.title}
                  </Badge>
                ))}
              </div>
            </div>
          );
        },
      },
      {
        id: "instance",
        header: () => null,
        cell: () => null,
        accessorFn: (row) => row.instanceData.displayName,
        filterFn: hasSome,
        enableGlobalFilter: false,
      },
    ] satisfies ColumnDef<ProjectSearchData>[];

    const supervisorColumn = {
      id: "supervisor",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Supervisor" />
      ),
      accessorFn: ({ supervisor }) =>
        `${supervisor.id} ${supervisor.name} ${supervisor.email}`,
      enableGlobalFilter: true,
      cell: ({ row }) => {
        const { supervisor } = row.original;
        return (
          <div className="space-y-1 py-1">
            <div className="font-medium">{supervisor.name}</div>
            <div className="font-sm text-muted-foreground">{supervisor.id}</div>
            <div className="text-sm text-muted-foreground">
              {supervisor.email}
            </div>
          </div>
        );
      },
    } satisfies ColumnDef<ProjectSearchData>;

    const actionColumn = {
      id: "actions",
      cell: ({ row }) => {
        return (
          <div className="h-full grid place-items-center dbg-lime-500">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onProjectSelect(row.original)}
              className="my-auto flex w-44 items-center gap-2 dbg-amber-500"
            >
              <Copy className="h-4 w-4" />
              Use Project Details
            </Button>
          </div>
        );
      },
      enableSorting: false,
      enableGlobalFilter: false,
    } satisfies ColumnDef<ProjectSearchData>;

    return userRole === Role.ADMIN
      ? [actionColumn, ...projectColumns, supervisorColumn]
      : [actionColumn, ...projectColumns];
  }, [onProjectSelect, userRole]);
}
