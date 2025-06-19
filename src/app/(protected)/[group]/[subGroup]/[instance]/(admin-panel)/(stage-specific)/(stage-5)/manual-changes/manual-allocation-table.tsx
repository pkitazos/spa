"use client";

import { useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RotateCcw, Save, SaveAll } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  StudentAllocation,
  ProjectInfo,
  SupervisorInfo,
  ValidationWarning,
} from "./types";
import { ProjectCombobox } from "./project-combobox";
import { SupervisorCombobox } from "./supervisor-combobox";

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
      const hasCompatibleFlag = allocation.studentFlags.some((flag) =>
        project.flags.includes(flag),
      );
      if (!hasCompatibleFlag) {
        warnings.push({
          type: "flag-mismatch",
          message: `Student flags (${allocation.studentFlags.join(", ")}) don't match project requirements (${project.flags.join(", ")})`,
          severity: "warning",
        });
      }

      // Supervisor workload checks
      const totalAllocations =
        supervisor.currentAllocations + supervisor.pendingAllocations;
      if (totalAllocations > supervisor.allocationTarget) {
        warnings.push({
          type: "exceeds-target",
          message: `Exceeds supervisor target (${totalAllocations}/${supervisor.allocationTarget})`,
          severity: "warning",
        });
      }
      if (totalAllocations > supervisor.allocationUpperBound) {
        warnings.push({
          type: "exceeds-quota",
          message: `Exceeds supervisor quota (${totalAllocations}/${supervisor.allocationUpperBound})`,
          severity: "error",
        });
      }

      // Supervisor change warning
      if (project.originalSupervisorId !== allocation.newSupervisorId) {
        warnings.push({
          type: "supervisor-change",
          message: "Different supervisor than project proposer",
          severity: "warning",
        });
      }

      // Already allocated check (for existing allocations being changed)
      if (
        allocation.originalProjectId &&
        allocation.originalProjectId !== allocation.newProjectId
      ) {
        warnings.push({
          type: "already-allocated",
          message: "Student already allocated to different project",
          severity: "warning",
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

          let updated = { ...allocation, [field]: value };

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

  // Reset individual student
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

  // Save individual student
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

  // Save all changes
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
              <TableHead className="px-4 py-3 text-left font-medium">
                Warnings
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
  return (
    <TableRow className={`border-b ${allocation.isDirty ? "bg-blue-50" : ""}`}>
      <TableCell className="px-4 py-3">
        <div className="space-y-1">
          <div className="font-medium">{allocation.studentName}</div>
          <div className="text-sm text-gray-500">{allocation.studentId}</div>
          <div className="flex gap-1">
            {allocation.studentFlags.map((flag) => (
              <Badge key={flag.id} variant="outline" className="text-xs">
                {flag.title}
              </Badge>
            ))}
          </div>
        </div>
      </TableCell>

      <TableCell className="px-4 py-3">
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

      <TableCell className="px-4 py-3">
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

      <TableCell className="px-4 py-3">
        <div className="space-y-1">
          {allocation.warnings.map((warning, index) => (
            <Badge
              key={index}
              variant={
                warning.severity === "error" ? "destructive" : "secondary"
              }
              className="text-xs"
            >
              {warning.message}
            </Badge>
          ))}
        </div>
      </TableCell>

      <TableCell className="px-4 py-3">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onReset(allocation.studentId)}
            disabled={!allocation.isDirty}
          >
            <RotateCcw className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            onClick={() => onSave(allocation.studentId)}
            disabled={!allocation.isDirty}
          >
            <Save className="h-3 w-3" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
