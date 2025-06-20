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
import { ProjectAllocationStatus } from "@/dto";

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
    (
      allocation: StudentAllocation,
      currentChange?: { studentId: string; supervisorId?: string },
    ): ValidationWarning[] => {
      const warnings: ValidationWarning[] = [];

      console.log(
        `[calculateWarnings] Starting for student ${allocation.studentId}`,
      );

      if (currentChange) {
        console.log(
          `[calculateWarnings] Current change context:`,
          currentChange,
        );
      }

      if (!allocation.newProjectId || !allocation.newSupervisorId) {
        console.log(
          `[calculateWarnings] Missing project or supervisor, returning empty warnings`,
        );
        return warnings;
      }

      const project = projects.find((p) => p.id === allocation.newProjectId);
      const baseSupervisor = supervisors.find(
        (s) => s.id === allocation.newSupervisorId,
      );

      console.log(`[calculateWarnings] Found project:`, project);
      console.log(`[calculateWarnings] Found base supervisor:`, baseSupervisor);

      if (!project || !baseSupervisor) return warnings;

      // Adjust supervisor data to include current change
      let supervisor = baseSupervisor;
      if (
        currentChange &&
        currentChange.supervisorId === allocation.newSupervisorId &&
        project.originalSupervisorId !== allocation.newSupervisorId
      ) {
        supervisor = {
          ...baseSupervisor,
          pendingAllocations: baseSupervisor.pendingAllocations + 1,
        };
        console.log(
          `[calculateWarnings] Adjusted supervisor for current change (supervisor actually changing):`,
          supervisor,
        );
      }

      // Flag compatibility check
      const hasCompatibleFlag = allocation.studentFlags.some(
        (flag) => !!project.flags.find((f) => f.title === flag.title),
      );
      console.log(`[calculateWarnings] Flag compatibility check:`, {
        studentFlags: allocation.studentFlags.map((f) => f.title),
        projectFlags: project.flags.map((f) => f.title),
        hasCompatibleFlag,
      });

      if (!hasCompatibleFlag) {
        console.log(`[calculateWarnings] Adding flag mismatch warning`);
        warnings.push({
          type: ValidationWarningType.FlagMismatch,
          message: `Student flags (${allocation.studentFlags.map((f) => f.title).join(", ")}) don't match project requirements (${project.flags.map((f) => f.title).join(", ")})`,
          severity: ValidationWarningSeverity.Warning,
        });
      }

      // Supervisor workload checks
      const totalAllocations =
        supervisor.currentAllocations + supervisor.pendingAllocations;
      console.log(`[calculateWarnings] Supervisor workload:`, {
        supervisorId: supervisor.id,
        supervisorName: supervisor.name,
        currentAllocations: supervisor.currentAllocations,
        pendingAllocations: supervisor.pendingAllocations,
        totalAllocations,
        allocationTarget: supervisor.allocationTarget,
        allocationUpperBound: supervisor.allocationUpperBound,
        exceedsTarget: totalAllocations > supervisor.allocationTarget,
        exceedsQuota: totalAllocations > supervisor.allocationUpperBound,
      });

      if (totalAllocations > supervisor.allocationTarget) {
        console.log(`[calculateWarnings] Adding exceeds target warning`);
        warnings.push({
          type: ValidationWarningType.ExceedsTarget,
          message: `Exceeds supervisor target (${totalAllocations}/${supervisor.allocationTarget})`,
          severity: ValidationWarningSeverity.Warning,
        });
      }
      if (totalAllocations > supervisor.allocationUpperBound) {
        console.log(`[calculateWarnings] Adding exceeds quota warning`);
        warnings.push({
          type: ValidationWarningType.ExceedsQuota,
          message: `Exceeds supervisor quota (${totalAllocations}/${supervisor.allocationUpperBound})`,
          severity: ValidationWarningSeverity.Error,
        });
      }

      // Supervisor change warning
      console.log(`[calculateWarnings] Supervisor change check:`, {
        projectOriginalSupervisor: project.originalSupervisorId,
        allocationNewSupervisor: allocation.newSupervisorId,
        isDifferent:
          project.originalSupervisorId !== allocation.newSupervisorId,
      });

      if (project.originalSupervisorId !== allocation.newSupervisorId) {
        console.log(`[calculateWarnings] Adding supervisor change warning`);
        warnings.push({
          type: ValidationWarningType.SupervisorChange,
          message: "Different supervisor than project proposer",
          severity: ValidationWarningSeverity.Warning,
        });
      }

      // Project availability checks
      console.log(`[calculateWarnings] Project availability check:`, {
        projectId: project.id,
        projectStatus: project.status,
        isAllocated: project.status === ProjectAllocationStatus.ALLOCATED,
        isPreAllocated:
          project.status === ProjectAllocationStatus.PRE_ALLOCATED,
      });

      if (project.status === ProjectAllocationStatus.ALLOCATED) {
        console.log(
          `[calculateWarnings] Adding project already allocated warning`,
        );
        warnings.push({
          type: ValidationWarningType.ProjectAllocated,
          message: "This project is already allocated to another student",
          severity: ValidationWarningSeverity.Error,
        });
      }

      if (project.status === ProjectAllocationStatus.PRE_ALLOCATED) {
        console.log(`[calculateWarnings] Adding project pre-allocated warning`);
        warnings.push({
          type: ValidationWarningType.ProjectPreAllocated,
          message: "This project is pre-allocated to another student",
          severity: ValidationWarningSeverity.Error,
        });
      }

      // Already allocated check
      console.log(`[calculateWarnings] Already allocated check:`, {
        originalProjectId: allocation.originalProjectId,
        newProjectId: allocation.newProjectId,
        hasOriginal: !!allocation.originalProjectId,
        isDifferent:
          allocation.originalProjectId &&
          allocation.originalProjectId !== allocation.newProjectId,
      });

      if (
        allocation.originalProjectId &&
        allocation.originalProjectId !== allocation.newProjectId
      ) {
        console.log(`[calculateWarnings] Adding already allocated warning`);
        warnings.push({
          type: ValidationWarningType.AlreadyAllocated,
          message: "Student already allocated to different project",
          severity: ValidationWarningSeverity.Warning,
        });
      }

      console.log(
        `[calculateWarnings] Final warnings for ${allocation.studentId}:`,
        warnings,
      );
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

          // Create new allocation object with the field update
          let newAllocation = { ...allocation, [field]: value };

          // Auto-select supervisor when project is selected
          if (field === "newProjectId" && value) {
            const project = projects.find((p) => p.id === value);
            if (project) {
              newAllocation = {
                ...newAllocation,
                newSupervisorId: project.originalSupervisorId,
              };
            }
          }

          // Calculate dirty state
          const isOriginalState =
            newAllocation.newProjectId === newAllocation.originalProjectId &&
            newAllocation.newSupervisorId ===
              newAllocation.originalSupervisorId;

          // Determine if we should pass current change context
          const currentChange = newAllocation.newSupervisorId
            ? { studentId, supervisorId: newAllocation.newSupervisorId }
            : undefined;

          // Return completely new object
          return {
            ...newAllocation,
            isDirty: !isOriginalState,
            warnings: calculateWarnings(newAllocation, currentChange),
          };
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
