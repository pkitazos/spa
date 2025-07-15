"use client";

import { ColumnDef } from "@tanstack/react-table";
import { RotateCcw, Save } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { DataTableColumnHeader } from "@/components/ui/data-table/data-table-column-header";

import { ProjectCombobox } from "./project-combobox";
import { SupervisorCombobox } from "./supervisor-combobox";
import {
  ManualAllocationStudent,
  ManualAllocationProject,
  ManualAllocationSupervisor,
} from "./manual-allocation-types";
import Link from "next/link";
import { usePathInInstance } from "@/components/params-context";
import { PAGES } from "@/config/pages";
import { cn } from "@/lib/utils";
import { WithTooltip } from "@/components/ui/tooltip-wrapper";

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
            <div className="flex flex-wrap gap-1">
              {student.flags.map((flag) => (
                <Badge
                  key={flag.id}
                  variant="accent"
                  className="px-2 py-1 text-xs"
                >
                  {flag.title}
                </Badge>
              ))}
            </div>
          </div>
        );
      },
      filterFn: (row, _, value) => {
        const searchValue = value.toLowerCase();
        const student = row.original;
        return (
          student.name.toLowerCase().includes(searchValue) ||
          student.id.toLowerCase().includes(searchValue)
        );
      },
    },

    {
      id: "flags",
      accessorFn: (row) => row.flags.map((flag) => flag.id),
      header: () => null,
      cell: () => null,
      filterFn: (row, _, value: string[]) => {
        if (!value?.length) return true;
        const studentFlagIds = row.original.flags.map((flag) => flag.id);
        return value.some((flagId) => studentFlagIds.includes(flagId));
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
                <RotateCcw className="h-3 w-3" />
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
                <Save className="h-3 w-3" />
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
