"use client";
import { MinusCircleIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { WithTooltip } from "@/components/ui/tooltip-wrapper";

import {
  addToAllocations,
  findAllocation,
  getSelectedProject,
  getStudent,
  removeFromAllocations,
} from "@/lib/utils/allocation-adjustment";

import { useAllocDetails } from "./allocation-store";

export function RowRemovalButton({ rowIdx }: { rowIdx: number }) {
  const studentsBackup = useAllocDetails((s) => s.studentsBackup);
  const allProjects = useAllocDetails((s) => s.projects);

  const selectedStudentIds = useAllocDetails((s) => s.selectedStudentIds);
  const setSelectedStudentIds = useAllocDetails((s) => s.setSelectedStudentIds);
  const updateProjects = useAllocDetails((s) => s.updateProjects);

  function handleRowRemoval(idx: number) {
    /**
     * each row represents a student
     * presumably, when I add a new row, I do so to change that student's project allocation
     * when I remove the row however, I want to reset the allocation of that student back to its default
     *
     * I can do that, by finding which project the student was originally allocated to
     * and comparing that to the project the student is currently allocated to
     * if these are the same, just delete the row
     * otherwise remove the studentId from the project it is currently allocated to
     * and add the studentId to the project it was originally allocated to
     */

    const studentId = selectedStudentIds[idx];
    const student = getStudent(studentsBackup, studentId);

    const prevAlloc = getSelectedProject(allProjects, student);
    const currAlloc = findAllocation(allProjects, studentId);

    if (prevAlloc) {
      if (!currAlloc) {
        const prevIdx = allProjects.findIndex((p) => p.id === prevAlloc.id);

        const updatedPrev = addToAllocations(prevAlloc, studentId);

        const projects = structuredClone(allProjects);
        projects[prevIdx] = updatedPrev;

        updateProjects(projects);
      } else {
        const prevIdx = allProjects.findIndex((p) => p.id === prevAlloc.id);
        const currIdx = allProjects.findIndex((p) => p.id === currAlloc.id);

        if (prevAlloc.id !== currAlloc.id) {
          const revertedAlloc = addToAllocations(prevAlloc, studentId);
          const discardedAlloc = removeFromAllocations(currAlloc, studentId);

          const projects = structuredClone(allProjects);
          projects[prevIdx] = revertedAlloc;
          projects[currIdx] = discardedAlloc;

          updateProjects(projects);
        }
      }
    } else {
      if (currAlloc) {
        const currIdx = allProjects.findIndex((p) => p.id === currAlloc.id);

        const discardedAlloc = removeFromAllocations(currAlloc, studentId);

        const projects = structuredClone(allProjects);
        projects[currIdx] = discardedAlloc;
        updateProjects(projects);
      }
    }

    setSelectedStudentIds(selectedStudentIds.toSpliced(idx, 1));
    return;
  }

  return (
    <WithTooltip tip="Discard Changes">
      <Button
        variant="ghost"
        size="icon"
        className="h-12 w-12 text-muted-foreground"
        onClick={() => handleRowRemoval(rowIdx)}
      >
        <MinusCircleIcon className="h-5 w-5" />
      </Button>
    </WithTooltip>
  );
}
