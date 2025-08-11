import { useMemo } from "react";

import { type ColumnDef } from "@tanstack/react-table";

import { spacesLabels } from "@/config/spaces";

import { type InstanceDTO, type ProjectDTO, type SupervisorDTO } from "@/dto";

import { Badge } from "@/components/ui/badge";
import { DataTableColumnHeader } from "@/components/ui/data-table/data-table-column-header";

import { hasSome } from "./utils";

export type ProjectSearchColumn = {
  instanceData: InstanceDTO;
  project: ProjectDTO;
  supervisor: SupervisorDTO;
};

export function useProjectSearchColumns() {
  return useMemo<ColumnDef<ProjectSearchColumn>[]>(() => {
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
    ] satisfies ColumnDef<ProjectSearchColumn>[];

    const supervisorColumn = {
      id: "supervisor",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Supervisor" />
      ),
      accessorFn: (row) =>
        `${row.supervisor.id} ${row.supervisor.name} ${row.supervisor.email}`,
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
    } satisfies ColumnDef<ProjectSearchColumn>;

    return [...projectColumns, supervisorColumn];
  }, []);
}
