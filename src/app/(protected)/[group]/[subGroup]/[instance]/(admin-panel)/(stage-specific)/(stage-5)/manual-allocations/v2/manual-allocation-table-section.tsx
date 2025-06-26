"use client";

import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

import { useInstanceParams } from "@/components/params-context";

import { ManualAllocationDataTable } from "./manual-allocation-data-table";
import {
  ManualAllocationStudent,
  ManualAllocationProject,
  ManualAllocationSupervisor,
  ValidationWarning,
  ValidationWarningType,
  ValidationWarningSeverity,
} from "./manual-allocation-types";
import { ProjectAllocationStatus } from "@/dto";

interface ManualAllocationDataTableSectionProps {
  initialStudents: ManualAllocationStudent[];
  initialProjects: ManualAllocationProject[];
  initialSupervisors: ManualAllocationSupervisor[];
}

export function ManualAllocationDataTableSection({
  initialStudents,
  initialProjects,
  initialSupervisors,
}: ManualAllocationDataTableSectionProps) {
  const params = useInstanceParams();
  const [students, setStudents] = useState(initialStudents);
  const [projects] = useState(initialProjects);
  const [baseSupervisors] = useState(initialSupervisors);

  // compute supervisors pending allocations
  const supervisors = useMemo(() => {
    const pendingCounts = students.reduce<Record<string, number>>(
      (acc, student) => {
        if (student.selectedSupervisorId && student.isDirty) {
          acc[student.selectedSupervisorId] =
            (acc[student.selectedSupervisorId] ?? 0) + 1;
        }
        return acc;
      },
      {},
    );

    return baseSupervisors.map((supervisor) => ({
      ...supervisor,
      pendingAllocations: pendingCounts[supervisor.id] || 0,
    }));
  }, [students, baseSupervisors]);

  const calculateWarnings = useCallback(
    (
      allocation: ManualAllocationStudent,
      currentChange?: { studentId: string; supervisorId?: string },
    ): ValidationWarning[] => {
      const warnings: ValidationWarning[] = [];

      if (!allocation.selectedProjectId || !allocation.selectedSupervisorId) {
        return warnings;
      }

      const project = projects.find(
        (p) => p.id === allocation.selectedProjectId,
      );
      const baseSupervisor = supervisors.find(
        (s) => s.id === allocation.selectedSupervisorId,
      );

      if (!project || !baseSupervisor) return warnings;

      // Adjust supervisor data to include current change
      let supervisor = baseSupervisor;
      if (
        currentChange &&
        currentChange.supervisorId === allocation.selectedSupervisorId &&
        project.supervisorId !== allocation.selectedSupervisorId
      ) {
        supervisor = {
          ...baseSupervisor,
          pendingAllocations: baseSupervisor.pendingAllocations + 1,
        };
      }

      // Flag compatibility check
      const hasCompatibleFlag = allocation.flags.some(
        (flag) => !!project.flags.find((f) => f.title === flag.title),
      );
      if (!hasCompatibleFlag) {
        warnings.push({
          type: ValidationWarningType.FlagMismatch,
          message: `Student flags (${allocation.flags.map((f) => f.title).join(", ")}) don't match project requirements (${project.flags.map((f) => f.title).join(", ")})`,
          severity: ValidationWarningSeverity.Warning,
        });
      }

      // Project availability checks
      if (
        project.status === ProjectAllocationStatus.ALGORITHMICALLY_ALLOCATED ||
        project.status === ProjectAllocationStatus.MANUALLY_ALLOCATED ||
        project.status === ProjectAllocationStatus.RANDOMLY_ALLOCATED
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
      if (project.supervisorId !== allocation.selectedSupervisorId) {
        warnings.push({
          type: ValidationWarningType.SupervisorChange,
          message: "Different supervisor than project proposer",
          severity: ValidationWarningSeverity.Warning,
        });
      }

      // Already allocated check (for existing allocations being changed)
      if (
        allocation.originalProjectId &&
        allocation.originalProjectId !== allocation.selectedProjectId
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

  // todo: FP this boi
  const handleUpdateAllocation = useCallback(
    (studentId: string, field: "project" | "supervisor", value?: string) => {
      setStudents((prev) =>
        prev.map((student) => {
          if (student.id !== studentId) return student;

          let updatedStudent = { ...student };

          if (field === "project") {
            // auto-select supervisor when project is selected
            updatedStudent.selectedProjectId = value;

            if (value) {
              const project = projects.find((p) => p.id === value);
              if (project) {
                updatedStudent.selectedSupervisorId = project.supervisorId;
              }
            }
          } else {
            updatedStudent.selectedSupervisorId = value;
          }

          updatedStudent.isDirty =
            updatedStudent.selectedProjectId !==
              updatedStudent.originalProjectId ||
            updatedStudent.selectedSupervisorId !==
              updatedStudent.originalSupervisorId;

          updatedStudent.warnings = calculateWarnings(updatedStudent);

          return updatedStudent;
        }),
      );
    },
    [projects, calculateWarnings],
  );

  const handleRemoveAllocation = useCallback((studentId: string) => {
    // todo: implement removal logic
    toast.info(`Remove allocation for student ${studentId} (not implemented)`);
  }, []);

  const handleSave = useCallback(async (studentId: string) => {
    // todo: implement save logic
    toast.promise(new Promise((resolve) => setTimeout(resolve, 1000)), {
      loading: `Saving allocation for student ${studentId}...`,
      success: "Successfully saved allocation",
      error: "Failed to save allocation",
    });
  }, []);

  const handleSaveAll = useCallback(async () => {
    const dirtyStudents = students.filter((s) => s.isDirty);
    // todo: implement save logic
    toast.promise(new Promise((resolve) => setTimeout(resolve, 2000)), {
      loading: `Saving ${dirtyStudents.length} allocation(s)...`,
      success: `Successfully saved ${dirtyStudents.length} allocation(s)`,
      error: "Failed to save allocations",
    });
  }, [students]);

  const handleReset = useCallback((studentId: string) => {
    setStudents((prev) =>
      prev.map((student) => {
        if (student.id !== studentId) return student;

        return {
          ...student,
          selectedProjectId: student.originalProjectId,
          selectedSupervisorId: student.originalSupervisorId,
          isDirty: false,
          warnings: [],
        };
      }),
    );
  }, []);

  return (
    <ManualAllocationDataTable
      students={students}
      projects={projects}
      supervisors={supervisors}
      onUpdateAllocation={handleUpdateAllocation}
      onRemoveAllocation={handleRemoveAllocation}
      onSave={handleSave}
      onSaveAll={handleSaveAll}
      onReset={handleReset}
    />
  );
}
