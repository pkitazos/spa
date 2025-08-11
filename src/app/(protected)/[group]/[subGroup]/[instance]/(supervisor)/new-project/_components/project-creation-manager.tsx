"use client";

import { useState, useRef } from "react";

import { type InstanceDTO, type ProjectDTO, type SupervisorDTO } from "@/dto";
import {
  type ProjectFormInitialisationDTO,
  type ProjectFormInternalStateDTO,
} from "@/dto/project";

import { type Role } from "@/db/types";

import { CreateProjectForm } from "@/components/project-form/create-project";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { nubs } from "@/lib/utils/list-unique";

import { ProjectSearchDataTable } from "./project-search-data-table";

interface ProjectCreationManagerProps {
  previousProjectData: {
    instanceData: InstanceDTO;
    project: ProjectDTO;
    supervisor: SupervisorDTO;
  }[];
  formInitialisationData: ProjectFormInitialisationDTO;
  userRole: typeof Role.ADMIN | typeof Role.SUPERVISOR;
  currentUserId: string;
  onBehalfOf?: string;
}

export function ProjectCreationManager({
  previousProjectData,
  formInitialisationData,
  userRole,
  currentUserId,
  onBehalfOf,
}: ProjectCreationManagerProps) {
  const [selectedProject, setSelectedProject] = useState<ProjectDTO | null>(
    null,
  );
  const [pendingProject, setPendingProject] = useState<ProjectDTO | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [formKey, setFormKey] = useState(0); // Force form re-render when defaultValues change

  // We'll track if form is dirty through this ref
  const formIsDirtyRef = useRef(false);

  const handleProjectSelect = (project: ProjectDTO) => {
    // If form is dirty, show confirmation dialog
    if (formIsDirtyRef.current) {
      setPendingProject(project);
      setShowConfirmDialog(true);
    } else {
      // Form is clean, immediately apply template
      setSelectedProject(project);
      setFormKey((prev) => prev + 1); // Force form re-render
    }
  };

  const handleConfirmOverride = () => {
    setSelectedProject(pendingProject);
    setFormKey((prev) => prev + 1); // Force form re-render
    formIsDirtyRef.current = false; // Reset dirty state
    setShowConfirmDialog(false);
    setPendingProject(null);
  };

  const handleCancelOverride = () => {
    setShowConfirmDialog(false);
    setPendingProject(null);
  };

  // Transform ProjectDTO to ProjectFormInternalStateDTO format
  const transformProjectToDefaultValues = (
    project: ProjectDTO,
  ): Partial<ProjectFormInternalStateDTO> => {
    return {
      title: project.title,
      description: project.description,
      flags: project.flags, // These should already be in the correct format
      tags: project.tags, // These should already be in the correct format
      capacityUpperBound: project.capacityUpperBound,
      isPreAllocated: !!project.preAllocatedStudentId,
      preAllocatedStudentId: project.preAllocatedStudentId,
      supervisorId: onBehalfOf ?? project.supervisorId,
    };
  };

  const filters = [
    {
      columnId: "instance",
      title: "Instance",
      options: previousProjectData
        .filter((item, idx, self) =>
          nubs(
            item,
            idx,
            self,
            (a, b) => a.instanceData.displayName === b.instanceData.displayName,
          ),
        )
        .map((row) => ({
          id: row.instanceData.displayName,
          displayName: row.instanceData.displayName,
        })),
    },
  ];

  const getDefaultValues = (): Partial<ProjectFormInternalStateDTO> => {
    if (!selectedProject) {
      return { supervisorId: onBehalfOf };
    }

    return transformProjectToDefaultValues(selectedProject);
  };

  return (
    <div className="space-y-10">
      <ProjectSearchDataTable
        data={previousProjectData}
        filters={filters}
        onProjectSelect={handleProjectSelect}
      />
      <CreateProjectForm
        key={formKey}
        formInitialisationData={formInitialisationData}
        userRole={userRole}
        currentUserId={currentUserId}
        onBehalfOf={onBehalfOf}
        defaultValues={getDefaultValues()}
        onFormDirtyChange={(isDirty) => {
          formIsDirtyRef.current = isDirty;
        }}
      />

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Replace Current Work?</DialogTitle>
            <DialogDescription>
              You have unsaved changes in the form. Using this template will
              replace your current work. Are you sure you want to continue?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelOverride}>
              Cancel
            </Button>
            <Button onClick={handleConfirmOverride}>Replace</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
