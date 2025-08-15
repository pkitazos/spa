import { useState, useMemo, useCallback } from "react";

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

import DataTable from "../ui/data-table/data-table";

import { useProjectSearchColumns } from "./project-search-columns";
import { makeFilters } from "./utils";

import { type ProjectSearchData } from ".";

export function ProjectTemplateSelector({
  previousProjectData,
  showSupervisorCol,
  requiresConfirm = false,
  handleSelect,
}: {
  previousProjectData: ProjectSearchData[];
  showSupervisorCol: boolean;
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

  const onProjectSelect = useCallback(
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

  const columns = useProjectSearchColumns({
    showSupervisorCol,
    onProjectSelect,
  });

  return (
    <div className="space-y-4">
      <DataTable
        searchParamPrefix="prev-projects"
        columns={columns}
        data={previousProjectData}
        filters={filters}
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
