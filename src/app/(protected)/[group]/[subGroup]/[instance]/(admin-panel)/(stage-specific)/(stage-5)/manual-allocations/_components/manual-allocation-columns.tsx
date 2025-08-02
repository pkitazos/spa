"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { RotateCcwIcon, SaveIcon, Trash2Icon } from "lucide-react";
import Link from "next/link";
import { z } from "zod";

import { PAGES } from "@/config/pages";

import { usePathInInstance } from "@/components/params-context";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { DataTableColumnHeader } from "@/components/ui/data-table/data-table-column-header";
import { WithTooltip } from "@/components/ui/tooltip-wrapper";

import { cn } from "@/lib/utils";

import {
  type ManualAllocationStudent,
  type ManualAllocationProject,
  type ManualAllocationSupervisor,
} from "./manual-allocation-types";
import { ProjectCombobox } from "./project-combobox";
import { SupervisorCombobox } from "./supervisor-combobox";

type ManualAllocationColumnsProps = {
  projects: ManualAllocationProject[];
  supervisors: ManualAllocationSupervisor[];
  onUpdateAllocation: (
    studentId: string,
    { projectId, supervisorId }: { projectId?: string; supervisorId?: string },
  ) => void;
  onRemoveAllocation: (studentId: string) => void;
  onSave: (studentId: string) => Promise<void>;
  onReset: (studentId: string) => void;
};

export function useManualAllocationColumns({
  projects,
  supervisors,
  onUpdateAllocation,
  onRemoveAllocation,
  onSave,
  onReset,
}: ManualAllocationColumnsProps): ColumnDef<ManualAllocationStudent>[] {
  const { getPath } = usePathInInstance();
  return [
    {
      id: "student",
      accessorFn: (row) => `${row.name} ${row.id}`,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Student" />
      ),
      cell: ({ row }) => {
        const student = row.original;
        return (
          <div className="space-y-2">
            <Link
              href={getPath(`${PAGES.allStudents.href}/${student.id}`)}
              className={cn(
                buttonVariants({ variant: "link" }),
                "p-0 text-sm font-medium",
              )}
            >
              {student.name}
            </Link>
            <div className="text-xs text-muted-foreground">{student.id}</div>
            <Badge variant="accent" className="rounded-md">
              {student.flag.displayName}
            </Badge>
          </div>
        );
      },
      filterFn: (row, _, value) => {
        const searchValue = z.string().parse(value).toLowerCase();
        const student = row.original;
        return (
          student.name.toLowerCase().includes(searchValue) ||
          student.id.toLowerCase().includes(searchValue)
        );
      },
    },

    {
      id: "flags",
      accessorFn: (row) => row.flag.id,
      header: () => null,
      cell: () => null,
      filterFn: (row, _, value: string[]) => {
        if (!value?.length) return true;
        return value.some((flagId) => flagId === row.original.flag.id);
      },
    },
    {
      id: "project",
      header: "Project",
      cell: ({ row }) => {
        const student = row.original;
        return (
          <ProjectCombobox
            projects={projects}
            value={student.selectedProjectId ?? student.originalProjectId}
            onValueChange={(value) =>
              onUpdateAllocation(student.id, { projectId: value ?? undefined })
            }
          />
        );
      },
    },
    {
      id: "supervisor",
      header: "Supervisor",
      cell: ({ row }) => {
        const student = row.original;
        return (
          <SupervisorCombobox
            supervisors={supervisors}
            value={student.selectedSupervisorId ?? student.originalSupervisorId}
            onValueChange={(value) =>
              onUpdateAllocation(student.id, {
                supervisorId: value ?? undefined,
              })
            }
          />
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row: { original: student } }) => (
        <div>
          <div className="flex items-center gap-2">
            <WithTooltip tip="Reset">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onReset(student.id)}
                disabled={!student.isDirty}
                className="h-8 w-8 p-0 "
              >
                <RotateCcwIcon className="h-3 w-3" />
              </Button>
            </WithTooltip>
            <WithTooltip tip="Save">
              <Button
                size="sm"
                onClick={() => onSave(student.id)}
                disabled={!student.isDirty}
                className={cn(
                  "h-8 w-8 bg-muted p-0 text-muted-foreground",
                  student.isDirty && "bg-primary text-primary-foreground",
                )}
              >
                <SaveIcon className="h-3 w-3" />
              </Button>
            </WithTooltip>
            <WithTooltip tip="Remove Allocation">
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onRemoveAllocation(student.id)}
                disabled={
                  student.originalProjectId === undefined ||
                  student.originalSupervisorId === undefined
                }
                className={cn(
                  "h-8 w-8 p-0",
                  (student.originalProjectId === undefined ||
                    student.originalSupervisorId === undefined) &&
                    "bg-muted  text-muted-foreground",
                )}
              >
                <Trash2Icon className="h-3 w-3" />
              </Button>
            </WithTooltip>
          </div>
          {student.isDirty && (
            <div className="mr-2 mt-3 flex items-center justify-center gap-1">
              <div className="h-2 w-2 rounded-full bg-blue-500"></div>
              <span className="text-xs font-medium text-blue-700">Pending</span>
            </div>
          )}
        </div>
      ),
    },
  ];
}
