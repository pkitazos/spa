"use client";

import { useInstanceParams } from "@/components/params-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ProjectAllocationStatus } from "@/dto";
import { api } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import { AlertTriangle, Info, RotateCcw, Save, SaveAll } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { ProjectCombobox } from "./project-combobox";
import { SupervisorCombobox } from "./supervisor-combobox";
import {
  type ProjectInfo,
  type StudentAllocation,
  type SupervisorInfo,
  type ValidationWarning,
  ValidationWarningSeverity,
  ValidationWarningType,
} from "./types";

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
  const params = useInstanceParams();
  const utils = api.useUtils();

  const [allocations, setAllocations] = useState(initialStudents);
  const [projects, setProjects] = useState(initialProjects);
  const [baseSupervisors] = useState(initialSupervisors);

  const { mutateAsync: saveAllocationsAsync } =
    api.institution.instance.saveManualStudentAllocations.useMutation();

  const invalidateStudents = utils.institution.instance.students.invalidate;
  const invalidateProjects =
    utils.institution.instance.getProjectsWithAllocationStatus.invalidate;

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

      if (!allocation.newProjectId || !allocation.newSupervisorId) {
        return warnings;
      }

      const project = projects.find((p) => p.id === allocation.newProjectId);
      const baseSupervisor = supervisors.find(
        (s) => s.id === allocation.newSupervisorId,
      );

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
      }

      // Flag compatibility check
      const hasCompatibleFlag = allocation.studentFlags.some(
        (flag) => !!project.flags.find((f) => f.title === flag.title),
      );
      if (!hasCompatibleFlag) {
        warnings.push({
          type: ValidationWarningType.FlagMismatch,
          message: `Student flags (${allocation.studentFlags.map((f) => f.title).join(", ")}) don't match project requirements (${project.flags.map((f) => f.title).join(", ")})`,
          severity: ValidationWarningSeverity.Warning,
        });
      }

      // Project availability checks
      if (
        project.status === ProjectAllocationStatus.ALGORITHMIC ||
        project.status === ProjectAllocationStatus.MANUAL ||
        project.status === ProjectAllocationStatus.RANDOM
      ) {
        warnings.push({
          type: ValidationWarningType.ProjectAllocated,
          message: "This project is already allocated to another student",
          severity: ValidationWarningSeverity.Error,
        });
      }

      if (project.status === ProjectAllocationStatus.PRE_ALLOCATED) {
        warnings.push({
          type: ValidationWarningType.ProjectPreAllocated,
          message: "This project is pre-allocated to another student",
          severity: ValidationWarningSeverity.Error,
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

          const isOriginalState =
            newAllocation.newProjectId === newAllocation.originalProjectId &&
            newAllocation.newSupervisorId ===
              newAllocation.originalSupervisorId;

          const currentChange = newAllocation.newSupervisorId
            ? { studentId, supervisorId: newAllocation.newSupervisorId }
            : undefined;

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

  const saveStudent = useCallback(
    async (studentId: string) => {
      const allocation = allocations.find((a) => a.studentId === studentId);
      if (
        !allocation ||
        !allocation.newProjectId ||
        !allocation.newSupervisorId
      )
        return;

      const allocationData = [
        {
          studentId: allocation.studentId,
          projectId: allocation.newProjectId,
          supervisorId: allocation.newSupervisorId,
        },
      ];

      void toast.promise(
        saveAllocationsAsync({ params, allocations: allocationData }).then(
          (results) => {
            const successful = results.filter((r) => r.success);
            const failed = results.filter((r) => !r.success);

            if (failed.length > 0) {
              const failedIds = failed.map((f) => f.studentId);
              toast.error(
                `Failed to save allocation for student: ${failedIds.join(", ")}`,
                { duration: Infinity, closeButton: true },
              );
            }

            // trying to optimistically update UI
            setAllocations((prevAllocations) => {
              return prevAllocations.map((alloc) => {
                const result = results.find(
                  (r) => r.studentId === alloc.studentId,
                );

                if (!result) return alloc;

                if (result.success) {
                  // was successfully created so we commit the changes
                  return {
                    ...alloc,
                    originalProjectId: alloc.newProjectId,
                    originalSupervisorId: alloc.newSupervisorId,
                    isDirty: false,
                    warnings: [], // we'll recalculate below
                  };
                } else {
                  // failed to be created so we reset to original state
                  return {
                    ...alloc,
                    newProjectId: alloc.originalProjectId,
                    newSupervisorId: alloc.originalSupervisorId,
                    isDirty: false,
                    warnings: [], // we'll recalculate below
                  };
                }
              });
            });

            setProjects((prevProjects) => {
              return prevProjects.map((project) => {
                const successfulResult = successful.find(
                  (r) =>
                    allocations.find((a) => a.studentId === r.studentId)
                      ?.newProjectId === project.id,
                );

                if (successfulResult) {
                  return {
                    ...project,
                    status: ProjectAllocationStatus.MANUAL,
                    currentStudentAllocationId: successfulResult.studentId,
                  };
                }

                return project;
              });
            });

            // recalculate supervisor counts - this will trigger supervisor memo to update
            // which will then trigger warning recalculation for all students
            // This is a bit of a hacky way to force re-render it also does not work :/
            setAllocations((prevAllocations) => {
              return prevAllocations.map((alloc) => ({
                ...alloc,
                warnings: calculateWarnings(alloc),
              }));
            });

            return successful.length;
          },
        ),
        {
          loading: `Saving allocation for student ${studentId}...`,
          error: "Something went wrong",
          success: (count) => `Successfully saved ${count} allocation(s)`,
        },
      );
    },
    [allocations, saveAllocationsAsync, calculateWarnings],
  );

  const saveAllChanges = useCallback(async () => {
    const dirtyAllocations = allocations
      .filter((a) => a.isDirty && a.newProjectId && a.newSupervisorId)
      .map((a) => ({
        studentId: a.studentId,
        projectId: a.newProjectId!,
        supervisorId: a.newSupervisorId!,
      }));

    void toast.promise(
      saveAllocationsAsync({ params, allocations: dirtyAllocations }).then(
        async (results) => {
          const successful = results.filter((r) => r.success);
          const failed = results.filter((r) => !r.success);

          if (failed.length > 0) {
            const failedIds = failed.map((f) => f.studentId);
            toast.error(
              `Failed to save allocations for students: ${failedIds.join(", ")}`,
              { duration: Infinity, closeButton: true },
            );
          }

          await invalidateStudents({ params });
          await invalidateProjects({ params });

          return successful.length;
        },
      ),
      {
        loading: `Saving ${dirtyAllocations.length} allocation(s)...`,
        error: "Something went wrong",
        success: (count) => `Successfully saved ${count} allocation(s)`,
      },
    );
  }, [
    allocations,
    saveAllocationsAsync,
    invalidateStudents,
    invalidateProjects,
  ]);

  const hasChanges = allocations.some((a) => a.isDirty);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <div className="flex items-center space-x-4">
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
            {allocations.map((allocation) => (
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
