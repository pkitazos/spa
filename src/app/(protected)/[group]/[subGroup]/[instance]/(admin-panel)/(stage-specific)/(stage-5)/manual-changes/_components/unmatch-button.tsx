import { TrashIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { WithTooltip } from "@/components/ui/tooltip-wrapper";

import { replaceUpdated } from "@/lib/utils/allocation-adjustment/project";
import {
  getProjectIdx,
  removeFromAllocations,
} from "@/lib/utils/allocation-adjustment/student";

import { useAllocDetails } from "./allocation-store";

export function UnmatchButton({ rowIdx }: { rowIdx: number }) {
  const selectedStudentIds = useAllocDetails((s) => s.selectedStudentIds);
  const allProjects = useAllocDetails((s) => s.projects);
  const updateProjects = useAllocDetails((s) => s.updateProjects);

  function handleClick() {
    const newProjects = structuredClone(allProjects);
    const studentId = selectedStudentIds[rowIdx];

    const selectedIdx = getProjectIdx(newProjects, studentId);

    const allocatedProject = newProjects[selectedIdx];

    const unallocatedProject = removeFromAllocations(
      allocatedProject,
      studentId,
    );

    newProjects[selectedIdx] = unallocatedProject;
    const updatedProjects = replaceUpdated(allProjects, newProjects);

    updateProjects(updatedProjects);
  }

  return (
    <WithTooltip tip="Unmatch student">
      <Button
        onClick={handleClick}
        size="icon"
        variant="destructive"
        className="h-12 w-12"
      >
        <TrashIcon className="h-5 w-5" />
      </Button>
    </WithTooltip>
  );
}
