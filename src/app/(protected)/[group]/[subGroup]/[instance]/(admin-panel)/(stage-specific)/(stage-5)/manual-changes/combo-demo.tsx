"use client";
import { useState } from "react";
import { ProjectCombobox } from "./project-combobox";
import { SupervisorCombobox } from "./supervisor-combobox";
import { ProjectAllocationStatus } from "@/dto";

const mockProjects = [
  {
    id: "p001",
    title: "Machine Learning for Healthcare Applications",
    flags: [
      { id: "flag1", title: "Level 4", description: "" },
      { id: "flag2", title: "Level 5", description: "" },
    ],
    originalSupervisorId: "sup001",
    status: ProjectAllocationStatus.UNALLOCATED,
  },
  {
    id: "p002",
    title: "Blockchain Security Analysis",
    flags: [{ id: "flag2", title: "Level 5", description: "" }],
    originalSupervisorId: "sup002",
    currentStudentAllocationId: "s001",
    status: ProjectAllocationStatus.ALLOCATED,
  },
  {
    id: "p003",
    title: "Web Development Project",
    flags: [{ id: "flag1", title: "Level 4", description: "" }],
    originalSupervisorId: "sup001",
    currentStudentAllocationId: "s002",
    status: ProjectAllocationStatus.PRE_ALLOCATED,
  },
];

const mockSupervisors = [
  {
    id: "sup001",
    name: "Dr. John Smith",
    allocationTarget: 3,
    allocationUpperBound: 5,
    currentAllocations: 2,
    pendingAllocations: 1,
  },
  {
    id: "sup002",
    name: "Prof. Jane Doe",
    allocationTarget: 2,
    allocationUpperBound: 4,
    currentAllocations: 1,
    pendingAllocations: 0,
  },
  {
    id: "sup003",
    name: "Dr. Sarah Wilson",
    allocationTarget: 4,
    allocationUpperBound: 6,
    currentAllocations: 5,
    pendingAllocations: 2,
  },
];

export function ComboboxDemo() {
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [selectedSupervisor, setSelectedSupervisor] = useState<string>("");

  return (
    <div className="space-y-8 p-8">
      <div className="space-y-6">
        <div>
          <label className="mb-2 block text-sm font-medium">
            Project Selection
          </label>
          <ProjectCombobox
            projects={mockProjects}
            value={selectedProject}
            onValueChange={setSelectedProject}
          />
          {selectedProject && (
            <p className="mt-2 text-sm text-gray-600">
              Selected project:{" "}
              {mockProjects.find((p) => p.id === selectedProject)?.title}
            </p>
          )}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            Supervisor Selection
          </label>
          <SupervisorCombobox
            supervisors={mockSupervisors}
            value={selectedSupervisor}
            onValueChange={setSelectedSupervisor}
          />
          {selectedSupervisor && (
            <p className="mt-2 text-sm text-gray-600">
              Selected supervisor:{" "}
              {mockSupervisors.find((s) => s.id === selectedSupervisor)?.name}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
