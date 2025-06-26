"use client";

import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

import { useInstanceParams } from "@/components/params-context";

import { ProjectAllocationStatus } from "@/dto";
import { api } from "@/lib/trpc/client";
import { useRouter } from "next/navigation";
import { ManualAllocationDataTable } from "./manual-allocation-data-table";
import {
  ManualAllocationProject,
  ManualAllocationStudent,
  ManualAllocationSupervisor,
  ValidationWarning,
  ValidationWarningSeverity,
  ValidationWarningType,
} from "./manual-allocation-types";

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
  const router = useRouter();

  const [students, setStudents] = useState(initialStudents);
  const [projects] = useState(initialProjects);
  const [baseSupervisors] = useState(initialSupervisors);

  const utils = api.useUtils();

  function refetchData() {
    utils.institution.instance.getAllocatedStudents.refetch();
    utils.institution.instance.getUnallocatedStudents.refetch();
    utils.institution.instance.getSupervisorsWithAllocations.refetch();
    utils.institution.instance.getProjectsWithAllocationStatus.refetch();
  }

  const { mutateAsync: api_saveAllocations } =
    api.institution.instance.saveManualStudentAllocations.useMutation({});

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

  // todo: redo this somehow
  // this is too complicated idk what I was thinking
  // it's also not even totally right
  // I'll have to revisit this when I have both hands
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
        currentChange.supervisorId === allocation.selectedSupervisorId
        // && project.supervisorId !== allocation.selectedSupervisorId
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

  const handleUpdateAllocation = useCallback(
    (studentId: string, field: "project" | "supervisor", id?: string) => {
      setStudents((prev) =>
        prev.map((student) => {
          if (student.id !== studentId) return student;

          let updatedStudent = { ...student };

          if (field === "project") {
            const project = id ? projects.find((p) => p.id === id) : undefined;

            updatedStudent = {
              ...updatedStudent,
              selectedProjectId: id,
              selectedSupervisorId: project?.supervisorId,
            };
          } else if (field === "supervisor") {
            updatedStudent = { ...updatedStudent, selectedSupervisorId: id };
          }

          const isDirty =
            updatedStudent.selectedProjectId !==
              updatedStudent.originalProjectId ||
            updatedStudent.selectedSupervisorId !==
              updatedStudent.originalSupervisorId;

          const warnings = calculateWarnings(updatedStudent, {
            studentId,
            supervisorId: updatedStudent.selectedSupervisorId,
          });

          return { ...updatedStudent, isDirty, warnings };
        }),
      );
    },
    [projects, calculateWarnings, students, setStudents],
  );

  const handleRemoveAllocation = useCallback((studentId: string) => {
    // todo: implement removal logic (+ UI)
    toast.info(`Remove allocation for student ${studentId} (not implemented)`);
  }, []);

  const handleSave = useCallback(
    async (studentId: string) => {
      const student = students.find((s) => s.id === studentId);
      if (!student) {
        toast.error(`Student with ID ${studentId} not found`);
        return;
      }

      if (!student.selectedProjectId || !student.selectedSupervisorId) {
        toast.error("Please select both project and supervisor before saving");
        return;
      }

      const allocations = [
        {
          studentId: student.id,
          projectId: student.selectedProjectId,
          supervisorId: student.selectedSupervisorId,
        },
      ];

      toast.promise(
        api_saveAllocations({ params, allocations }).then(() => {
          router.refresh();
          refetchData();
          // todo: post-save the save changes button still shows as dirty need to manually reset the state
        }),
        {
          loading: `Saving allocation for student ${studentId}...`,
          success: "Successfully saved allocation",
          error: "Failed to save allocation",
        },
      );
    },
    [students],
  );

  const handleSaveAll = useCallback(async () => {
    const dirtyStudents = students.filter((s) => s.isDirty);

    if (dirtyStudents.length === 0) {
      toast.info("No allocations to save");
      return;
    }

    const invalidStudents = dirtyStudents.filter(
      (student) => !student.selectedProjectId || !student.selectedSupervisorId,
    );

    const allocations = dirtyStudents
      .map((student) => {
        if (student.selectedProjectId && student.selectedSupervisorId)
          return {
            studentId: student.id,
            projectId: student.selectedProjectId,
            supervisorId: student.selectedSupervisorId,
          };
      })
      .filter(Boolean);

    if (invalidStudents.length > 0) {
      toast.error(
        `${invalidStudents.length} student(s) have missing project or supervisor selections.`,
      );
    }

    toast.promise(
      api_saveAllocations({ params, allocations }).then(() => {
        router.refresh();
        refetchData();
        // todo: post-save the save changes button still shows as dirty need to manually reset the state
      }),
      {
        loading: `Saving ${dirtyStudents.length} allocation(s)...`,
        success: `Successfully saved ${dirtyStudents.length} allocation(s)`,
        error: "Failed to save allocations",
      },
    );
  }, [students]);

  const handleReset = useCallback((studentId: string) => {
    // todo: resetting a change does not correctly updated the number of unsaved changes
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
