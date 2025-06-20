"use client";

import { useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RotateCcw, Save, SaveAll, AlertTriangle, Info } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  type StudentAllocation,
  type ProjectInfo,
  type SupervisorInfo,
  type ValidationWarning,
  ValidationWarningSeverity,
  ValidationWarningType,
} from "./types";
import { ProjectCombobox } from "./project-combobox";
import { SupervisorCombobox } from "./supervisor-combobox";
import { cn } from "@/lib/utils";

interface ManualAllocationTableProps {
  initialStudents: StudentAllocation[];
  initialProjects: ProjectInfo[];
  initialSupervisors: SupervisorInfo[];
}

export function ManualAllocationTable({
  initialStudents,
  initialProjects,
  initialSupervisors,
}: ManualAllocationTableProps) {
  const [allocations, setAllocations] = useState(initialStudents);
  const [projects] = useState(initialProjects);
  const [showAllocatedStudents, setShowAllocatedStudents] = useState(false);
  const [baseSupervisors] = useState(initialSupervisors);

  // Calculate supervisors with pending allocations
  const supervisors = useMemo(() => {
    const pendingCounts: Record<string, number> = {};

    allocations.forEach((allocation) => {
      if (allocation.newSupervisorId && allocation.isDirty) {
        pendingCounts[allocation.newSupervisorId] =
          (pendingCounts[allocation.newSupervisorId] || 0) + 1;
      }
    });

    return baseSupervisors.map((supervisor) => ({
      ...supervisor,
      pendingAllocations: pendingCounts[supervisor.id] || 0,
    }));
  }, [allocations, baseSupervisors]);

  // Calculate warnings for a single allocation
  const calculateWarnings = useCallback(
    (allocation: StudentAllocation): ValidationWarning[] => {
      const warnings: ValidationWarning[] = [];

      if (!allocation.newProjectId || !allocation.newSupervisorId) {
        return warnings;
      }

      const project = projects.find((p) => p.id === allocation.newProjectId);
      const supervisor = supervisors.find(
        (s) => s.id === allocation.newSupervisorId,
      );

      if (!project || !supervisor) return warnings;

      // Flag compatibility check
      const hasCompatibleFlag = allocation.studentFlags.some(
        // TODO: technically this should check IDs instead of titles,
        (flag) => !!project.flags.find((f) => f.title === flag.title),
      );
      if (!hasCompatibleFlag) {
        warnings.push({
          type: ValidationWarningType.FlagMismatch,
          message: `Student flags (${allocation.studentFlags.join(", ")}) don't match project requirements (${project.flags.join(", ")})`,
          severity: ValidationWarningSeverity.Warning,
        });
      }

      // Supervisor workload checks
      const totalAllocations =
        supervisor.currentAllocations + supervisor.pendingAllocations;
      if (totalAllocations > supervisor.allocationTarget) {
        warnings.push({
          type: ValidationWarningType.ExceedsTarget,
          message: `Exceeds supervisor target (${totalAllocations}/${supervisor.allocationTarget})`,
          severity: ValidationWarningSeverity.Warning,
        });
      }
      if (totalAllocations > supervisor.allocationUpperBound) {
        warnings.push({
          type: ValidationWarningType.ExceedsQuota,
          message: `Exceeds supervisor quota (${totalAllocations}/${supervisor.allocationUpperBound})`,
          severity: ValidationWarningSeverity.Error,
        });
      }

      // Supervisor change warning
      if (project.originalSupervisorId !== allocation.newSupervisorId) {
        warnings.push({
          type: ValidationWarningType.SupervisorChange,
          message: "Different supervisor than project proposer",
          severity: ValidationWarningSeverity.Warning,
        });
      }

      // Already allocated check (for existing allocations being changed)
      if (
        allocation.originalProjectId &&
        allocation.originalProjectId !== allocation.newProjectId
      ) {
        warnings.push({
          type: ValidationWarningType.AlreadyAllocated,
          message: "Student already allocated to different project",
          severity: ValidationWarningSeverity.Warning,
        });
      }

      return warnings;
    },
    [projects, supervisors],
  );

  // Update allocation and recalculate warnings
  const updateAllocation = useCallback(
    (
      studentId: string,
      field: "newProjectId" | "newSupervisorId",
      value?: string,
    ) => {
      setAllocations((prev) =>
        prev.map((allocation) => {
          if (allocation.studentId !== studentId) return allocation;

          const updated = { ...allocation, [field]: value };

          // Auto-select supervisor when project is selected
          if (field === "newProjectId" && value) {
            const project = projects.find((p) => p.id === value);
            if (project) {
              updated.newSupervisorId = project.originalSupervisorId;
            }
          }

          // Check if dirty
          const isOriginalState =
            updated.newProjectId === updated.originalProjectId &&
            updated.newSupervisorId === updated.originalSupervisorId;

          updated.isDirty = !isOriginalState;
          updated.warnings = calculateWarnings(updated);

          return updated;
        }),
      );
    },
    [projects, calculateWarnings],
  );

  const resetStudent = useCallback((studentId: string) => {
    setAllocations((prev) =>
      prev.map((allocation) => {
        if (allocation.studentId !== studentId) return allocation;

        return {
          ...allocation,
          newProjectId: allocation.originalProjectId,
          newSupervisorId: allocation.originalSupervisorId,
          isDirty: false,
          warnings: [],
        };
      }),
    );
  }, []);

  const saveStudent = useCallback(async (studentId: string) => {
    console.log("Saving student:", studentId);
    // TODO: add trpc api call here

    setAllocations((prev) =>
      prev.map((allocation) => {
        if (allocation.studentId !== studentId) return allocation;
        return {
          ...allocation,
          originalProjectId: allocation.newProjectId,
          originalSupervisorId: allocation.newSupervisorId,
          isDirty: false,
        };
      }),
    );
  }, []);

  const saveAllChanges = useCallback(async () => {
    const dirtyAllocations = allocations.filter((a) => a.isDirty);
    console.log("Saving all changes:", dirtyAllocations);
    // TODO: add trpc api call here

    setAllocations((prev) =>
      prev.map((allocation) => ({
        ...allocation,
        originalProjectId: allocation.newProjectId,
        originalSupervisorId: allocation.newSupervisorId,
        isDirty: false,
      })),
    );
  }, [allocations]);

  // TODO: this is currently slow asf
  // Filter allocations based on toggle
  const filteredAllocations = allocations.filter((allocation) => {
    if (showAllocatedStudents) return true;
    return !allocation.originalProjectId; // Show only unallocated
  });

  const hasChanges = allocations.some((a) => a.isDirty);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="show-allocated"
              checked={showAllocatedStudents}
              onCheckedChange={setShowAllocatedStudents}
            />
            <Label htmlFor="show-allocated">Show allocated students</Label>
          </div>

          <Button
            onClick={saveAllChanges}
            disabled={!hasChanges}
            className="flex items-center gap-2"
          >
            <SaveAll className="h-4 w-4" />
            Save All Changes ({allocations.filter((a) => a.isDirty).length})
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border">
        <Table className="w-full">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px] px-4 py-3 text-left font-medium">
                Student
              </TableHead>
              <TableHead className="px-4 py-3 text-left font-medium">
                Project
              </TableHead>
              <TableHead className="px-4 py-3 text-left font-medium">
                Supervisor
              </TableHead>
              <TableHead className="w-[120px] px-4 py-3 text-left font-medium">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {filteredAllocations.map((allocation) => (
              <StudentRow
                key={allocation.studentId}
                allocation={allocation}
                projects={projects}
                supervisors={supervisors}
                onUpdateAllocation={updateAllocation}
                onReset={resetStudent}
                onSave={saveStudent}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function StudentRow({
  allocation,
  projects,
  supervisors,
  onUpdateAllocation,
  onReset,
  onSave,
}: {
  allocation: StudentAllocation;
  projects: ProjectInfo[];
  supervisors: SupervisorInfo[];
  onUpdateAllocation: (
    studentId: string,
    field: "newProjectId" | "newSupervisorId",
    value?: string,
  ) => void;
  onReset: (studentId: string) => void;
  onSave: (studentId: string) => void;
}) {
  // Group warnings by severity for better display
  const errorWarnings = allocation.warnings.filter(
    (w) => w.severity === ValidationWarningSeverity.Error,
  );
  const warningMessages = allocation.warnings.filter(
    (w) => w.severity === ValidationWarningSeverity.Warning,
  );
  const hasWarnings = errorWarnings.length > 0 || warningMessages.length > 0;

  return (
    <>
      {/* Main table row */}
      <TableRow
        className={cn(
          "transition-colors",
          allocation.isDirty ? "bg-blue-50/50" : "hover:bg-muted/50",
          hasWarnings ? "border-b-0" : "border-b",
        )}
      >
        <TableCell className="px-4 py-4">
          <div className="space-y-2">
            <div className="text-sm font-medium">{allocation.studentName}</div>
            <div className="text-xs text-muted-foreground">
              {allocation.studentId}
            </div>
            <div className="flex flex-wrap gap-1">
              {allocation.studentFlags.map((flag) => (
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
        </TableCell>

        <TableCell className="px-4 py-4">
          <ProjectCombobox
            projects={projects}
            value={allocation.newProjectId}
            onValueChange={(value) =>
              onUpdateAllocation(
                allocation.studentId,
                "newProjectId",
                value || undefined,
              )
            }
          />
        </TableCell>

        <TableCell className="px-4 py-4">
          <SupervisorCombobox
            supervisors={supervisors}
            value={allocation.newSupervisorId}
            onValueChange={(value) =>
              onUpdateAllocation(
                allocation.studentId,
                "newSupervisorId",
                value || undefined,
              )
            }
          />
        </TableCell>

        <TableCell className="px-4 py-4">
          <div className="flex items-center gap-2">
            {/* Status indicator */}
            {allocation.isDirty && (
              <div className="mr-2 flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                <span className="text-xs font-medium text-blue-700">
                  Pending
                </span>
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => onReset(allocation.studentId)}
              disabled={!allocation.isDirty}
              className="h-8 w-8 p-0"
            >
              <RotateCcw className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              onClick={() => onSave(allocation.studentId)}
              disabled={!allocation.isDirty}
              className="h-8 w-8 p-0"
            >
              <Save className="h-3 w-3" />
            </Button>
          </div>
        </TableCell>
      </TableRow>

      {/* Warnings row - only shown when there are warnings */}
      {hasWarnings && (
        <TableRow
          className={cn(
            "border-b",
            allocation.isDirty ? "bg-blue-50/30" : "bg-gray-50/50",
          )}
        >
          <TableCell colSpan={4} className="px-4 py-3">
            <div className="space-y-2">
              {errorWarnings.length > 0 && (
                <div className="space-y-2">
                  {errorWarnings.map((warning, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3"
                    >
                      <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-600" />
                      <span className="text-sm text-red-800">
                        {warning.message}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {warningMessages.length > 0 && (
                <div className="space-y-2">
                  {warningMessages.map((warning, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-2 rounded-md border border-orange-200 bg-orange-50 p-3"
                    >
                      <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-orange-600" />
                      <span className="text-sm text-orange-800">
                        {warning.message}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}
