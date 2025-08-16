import { useMemo } from "react";

import { type ColumnDef } from "@tanstack/react-table";
import { CopyPlusIcon } from "lucide-react";
import { z } from "zod";

import { spacesLabels } from "@/config/spaces";

import { flagDtoSchema, tagDtoSchema } from "@/dto";

import { useInstanceParams } from "@/components/params-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTableColumnHeader } from "@/components/ui/data-table/data-table-column-header";
import { WithTooltip } from "@/components/ui/tooltip-wrapper";

import { isSameInstance } from "@/lib/utils/general/instance-params";

import { hasSome } from "./utils";

import { type ProjectSearchData } from ".";

export function useProjectSearchColumns({
  showSupervisorCol,
  onProjectSelect,
}: {
  showSupervisorCol: boolean;
  onProjectSelect: (data: ProjectSearchData) => void;
}) {
  const params = useInstanceParams();
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
                {isSameInstance(params, instanceData) &&
                  project.flags.map((flag) => (
                    <Badge
                      variant="accent"
                      className="w-40 rounded-md"
                      key={flag.id}
                    >
                      {flag.displayName}
                    </Badge>
                  ))}
              </div>
              <div className="flex items-center gap-2">
                {isSameInstance(params, instanceData) &&
                  project.tags.map((tag) => (
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
      {
        id: "Flags",
        header: () => null,
        cell: () => null,
        accessorFn: (row) => row.project.flags,
        filterFn: (row, columnId, value) => {
          const selectedFilters = z.array(z.string()).parse(value);
          const rowFlags = z.array(flagDtoSchema).parse(row.getValue(columnId));

          return (
            new Set(rowFlags.map((f) => f.id)).size > 0 &&
            selectedFilters.some((f) => rowFlags.some((rf) => rf.id === f))
          );
        },
        enableGlobalFilter: false,
      },
      {
        id: "Keywords",
        header: () => null,
        cell: () => null,
        accessorFn: (row) => row.project.tags,
        filterFn: (row, columnId, value) => {
          const ids = value as string[];
          const rowTags = z.array(tagDtoSchema).parse(row.getValue(columnId));
          return rowTags.some((e) => ids.includes(e.id));
        },
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
          <div className="h-full grid place-items-center">
            <WithTooltip tip="Copy Project Details into form">
              <Button
                variant="outline"
                size="icon"
                onClick={() => onProjectSelect(row.original)}
                className="my-auto flex items-center gap-2"
              >
                <CopyPlusIcon className="h-4 w-4" />
              </Button>
            </WithTooltip>
          </div>
        );
      },
      enableSorting: false,
      enableGlobalFilter: false,
    } satisfies ColumnDef<ProjectSearchData>;

    return showSupervisorCol
      ? [...projectColumns, supervisorColumn, actionColumn]
      : [...projectColumns, actionColumn];
  }, [onProjectSelect, params, showSupervisorCol]);
}
