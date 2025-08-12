"use client";

import { useCallback, useState, useRef } from "react";

import { spacesLabels } from "@/config/spaces";

import { type InstanceDTO, type ProjectDTO, type SupervisorDTO } from "@/dto";
import { type ProjectFormInitialisationDTO } from "@/dto/project";

import { type Role } from "@/db/types";

import { useInstanceParams } from "@/components/params-context";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { isSameInstance } from "@/lib/utils/general/instance-params";
import { nubsById } from "@/lib/utils/list-unique";

import { CreateProjectForm } from "../project-form/create-project";

import { ProjectSearchDataTable } from "./project-search-data-table";

export type ProjectSearchData = {
  instanceData: InstanceDTO;
  project: ProjectDTO;
  supervisor: SupervisorDTO;
};

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
  const params = useInstanceParams();

  const [selectedProjectData, setSelectedProjectData] = useState<
    ProjectSearchData | undefined
  >(undefined);
  const [pendingProjectData, setPendingProjectData] = useState<
    ProjectSearchData | undefined
  >(undefined);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const [hasUserEdits, setHasUserEdits] = useState(false);
  const [hasTemplate, setHasTemplate] = useState(false);

  const isApplyingTemplate = useRef(false);

  function handleProjectSelect(data: ProjectSearchData) {
    if (hasUserEdits) {
      setPendingProjectData(data);
      setShowConfirmDialog(true);
    } else {
      applyTemplate(data);
    }
  }

  function applyTemplate(data: ProjectSearchData) {
    isApplyingTemplate.current = true;
    setSelectedProjectData(data);
    setHasTemplate(true);
    setHasUserEdits(false);

    // resetting the flag after a brief delay to allow form updates to complete
    setTimeout(() => {
      isApplyingTemplate.current = false;
    }, 100);
  }

  function handleConfirmOverride() {
    if (pendingProjectData) {
      applyTemplate(pendingProjectData);
    }
    setShowConfirmDialog(false);
    setPendingProjectData(undefined);
  }

  function handleCancelOverride() {
    setShowConfirmDialog(false);
    setPendingProjectData(undefined);
  }

  function handleFormChange() {
    // ignore changes if we're currently applying a template
    if (isApplyingTemplate.current) {
      return;
    }

    // only set hasUserEdits if we have a template applied
    // (changes to a blank form don't count as "user edits")
    if (hasTemplate) {
      setHasUserEdits(true);
    }
  }

  const computeDefaultValues = useCallback(() => {
    if (!selectedProjectData) return { supervisorId: onBehalfOf };

    const { instanceData, project } = selectedProjectData;

    const sameInstance = isSameInstance(params, instanceData);

    return {
      title: selectedProjectData.project.title,
      description: selectedProjectData.project.description,
      flags: sameInstance ? project.flags : [],
      tags: sameInstance ? project.tags : [],
      supervisorId: onBehalfOf ?? selectedProjectData.project.supervisorId,
    };
  }, [selectedProjectData, params, onBehalfOf]);

  return (
    <div className="space-y-10">
      <div className="space-y-4">
        <ProjectSearchDataTable
          userRole={userRole}
          data={previousProjectData}
          filters={[
            {
              columnId: "instance",
              title: spacesLabels.instance.short,
              options: previousProjectData
                .map((row) => ({
                  id: row.instanceData.displayName,
                  displayName: row.instanceData.displayName,
                }))
                .filter(nubsById),
            },
          ]}
          onProjectSelect={handleProjectSelect}
        />
        {previousProjectData.length > 0 && (
          <div className="text-sm text-muted-foreground">
            <strong>Note:</strong> Flags and tags will only be copied from
            projects within the same instance.
          </div>
        )}
      </div>

      <CreateProjectForm
        formInitialisationData={formInitialisationData}
        userRole={userRole}
        currentUserId={currentUserId}
        onBehalfOf={onBehalfOf}
        defaultValues={computeDefaultValues()}
        onFormDirtyChange={handleFormChange}
      />

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
