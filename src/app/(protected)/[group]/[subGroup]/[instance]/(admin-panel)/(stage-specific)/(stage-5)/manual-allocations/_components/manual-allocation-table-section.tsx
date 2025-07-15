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
    utils.institution.instance.getAllocatedStudents.invalidate();
    utils.institution.instance.getUnallocatedStudents.invalidate();
    utils.institution.instance.getSupervisorsWithAllocations.invalidate();
    utils.institution.instance.getProjectsWithAllocationStatus.invalidate();
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
          type: ValidationWarningType.FLAG_MISMATCH,
          message: `Student flags (${allocation.flags.map((f) => f.title).join(", ")}) don't match project requirements (${project.flags.map((f) => f.title).join(", ")})`,
          severity: ValidationWarningSeverity.WARNING,
        });
      }

      // Project availability checks
      if (
        project.status === ProjectAllocationStatus.ALGORITHMIC ||
        project.status === ProjectAllocationStatus.MANUAL ||
        project.status === ProjectAllocationStatus.RANDOM
      ) {
        warnings.push({
          type: ValidationWarningType.PROJECT_ALLOCATED,
          message: "This project is already allocated to another student",
          severity: ValidationWarningSeverity.ERROR,
        });
      }

      if (project.status === ProjectAllocationStatus.PRE_ALLOCATED) {
        warnings.push({
          type: ValidationWarningType.PROJECT_PRE_ALLOCATED,
          message: "This project is pre-allocated to another student",
          severity: ValidationWarningSeverity.ERROR,
        });
      }

      // Supervisor workload checks
      const totalAllocations =
        supervisor.currentAllocations + supervisor.pendingAllocations;
      if (totalAllocations > supervisor.allocationTarget) {
        warnings.push({
          type: ValidationWarningType.EXCEEDS_TARGET,
          message: `Exceeds supervisor target (${totalAllocations}/${supervisor.allocationTarget})`,
          severity: ValidationWarningSeverity.WARNING,
        });
      }
      if (totalAllocations > supervisor.allocationUpperBound) {
        warnings.push({
          type: ValidationWarningType.EXCEEDS_QUOTA,
          message: `Exceeds supervisor quota (${totalAllocations}/${supervisor.allocationUpperBound})`,
          severity: ValidationWarningSeverity.ERROR,
        });
      }

      // Supervisor change warning
      if (project.supervisorId !== allocation.selectedSupervisorId) {
        warnings.push({
          type: ValidationWarningType.SUPERVISOR_CHANGE,
          message: "Different supervisor than project proposer",
          severity: ValidationWarningSeverity.WARNING,
        });
      }

      // Already allocated check (for existing allocations being changed)
      if (
        allocation.originalProjectId &&
        allocation.originalProjectId !== allocation.selectedProjectId
      ) {
        warnings.push({
          type: ValidationWarningType.ALREADY_ALLOCATED,
          message: "Student already allocated to different project",
          severity: ValidationWarningSeverity.WARNING,
        });
      }

      return warnings;
    },
    [projects, supervisors],
  );

  const handleUpdateAllocation = useCallback(
    (
      studentId: string,
      {
        projectId,
        supervisorId,
      }: { projectId?: string; supervisorId?: string },
    ) => {
      setStudents((prev) =>
        prev.map((student) => {
          if (student.id !== studentId) return student;

          let updatedStudent = { ...student };

          if (projectId !== undefined) {
            const project = projectId
              ? projects.find((p) => p.id === projectId)
              : undefined;

            updatedStudent = {
              ...updatedStudent,
              selectedProjectId: projectId,
              selectedSupervisorId: project?.supervisorId,
            };
          }

          if (supervisorId !== undefined) {
            updatedStudent = {
              ...updatedStudent,
              selectedSupervisorId: supervisorId,
            };
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
          setStudents((prev) =>
            prev.map((s) => {
              if (s.id !== studentId) return s;

              return {
                ...s,
                originalProjectId: s.selectedProjectId,
                originalSupervisorId: s.selectedSupervisorId,
                isDirty: false,
                warnings: [],
              };
            }),
          );
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
        setStudents((prev) =>
          prev.map((s) => {
            const dirtyStudent = dirtyStudents.find((ds) => ds.id === s.id);
            if (!dirtyStudent) return s;

            return {
              ...s,
              originalProjectId: s.selectedProjectId,
              originalSupervisorId: s.selectedSupervisorId,
              isDirty: false,
              warnings: [],
            };
          }),
        );
      }),
      {
        loading: `Saving ${dirtyStudents.length} allocation(s)...`,
        success: `Successfully saved ${dirtyStudents.length} allocation(s)`,
        error: "Failed to save allocations",
      },
    );
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
