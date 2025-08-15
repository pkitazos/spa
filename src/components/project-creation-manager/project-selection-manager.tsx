import { useState, useMemo, useCallback } from "react";

import { type Role } from "@/db/types";

import { useInstanceParams } from "@/components/params-context";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";

import { ProjectSearchDataTable } from "./project-search-data-table";
import { makeFilters } from "./utils";

import { type ProjectSearchData } from ".";

export function ProjectSelectionManager({
  previousProjectData,
  userRole,
  requiresConfirm = false,
  handleSelect,
}: {
  previousProjectData: ProjectSearchData[];
  userRole: Role;
  requiresConfirm?: boolean;
  handleSelect: (p: ProjectSearchData) => void;
}) {
  const params = useInstanceParams();

  const [open, setOpen] = useState<boolean | undefined>(undefined);
  const [pendingProject, setPendingProject] = useState<
    ProjectSearchData | undefined
  >(undefined);

  const filters = useMemo(
    () => makeFilters(params, previousProjectData),
    [params, previousProjectData],
  );

  const handleProjectSelect = useCallback(
    (data: ProjectSearchData) => {
      if (!requiresConfirm) return handleSelect(data);
      setPendingProject(data);
      setOpen(true);
    },
    [handleSelect, requiresConfirm],
  );

  const handleCancel = useCallback(() => {
    setPendingProject(undefined);
    setOpen(undefined);
  }, []);

  const handleConfirm = useCallback(() => {
    if (pendingProject) handleSelect(pendingProject);
    handleCancel();
  }, [handleCancel, handleSelect, pendingProject]);

  return (
    <div className="space-y-4">
      <ProjectSearchDataTable
        userRole={userRole}
        data={previousProjectData}
        filters={filters}
        onProjectSelect={handleProjectSelect}
      />
      {previousProjectData.length > 0 && (
        <div className="text-sm text-muted-foreground">
          <strong>Note:</strong> Flags and tags will only be copied from
          projects within the same instance.
        </div>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Replace Current Work?</DialogTitle>
            <DialogDescription>
              You have unsaved changes in the form. Using this template will
              replace your current work. Are you sure you want to continue?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleConfirm}>Replace</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
