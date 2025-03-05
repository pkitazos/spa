"use client";
import { useDroppable } from "@dnd-kit/core";

import { Card } from "@/components/ui/card";
import { WithTooltip } from "@/components/ui/tooltip-wrapper";

import { cn } from "@/lib/utils";
import { getProjectInfo } from "@/lib/utils/allocation-adjustment";
import { withinBounds } from "@/lib/utils/allocation-adjustment/project";
import {
  getProjectSupervisor,
  withinCapacity,
} from "@/lib/utils/allocation-adjustment/supervisor";

import { useAllocDetails } from "./allocation-store";
import { ProjectCardTooltip } from "./project-card-tooltip";

export function ProjectCard({
  project: { id: projectId, selected: originallySelected },
  studentId,
}: {
  project: { id: string; selected: boolean };
  studentId: string;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: projectId });

  const allSupervisors = useAllocDetails((s) => s.supervisors);
  const allProjects = useAllocDetails((s) => s.projects);
  const projectInfo = getProjectInfo(allProjects, projectId);

  const currentlySelected = projectInfo.allocatedTo.includes(studentId);
  const invalid = currentlySelected && !withinBounds(projectInfo);

  const supervisor = getProjectSupervisor(projectInfo, allSupervisors);
  const overworked = !withinCapacity(allProjects, supervisor);

  return (
    <WithTooltip
      duration={300}
      tip={<ProjectCardTooltip projectInfo={projectInfo} />}
    >
      <Card
        ref={setNodeRef}
        className={cn(
          "my-1.5 flex min-h-20 min-w-32 items-center justify-center overflow-hidden p-3 text-center",
          originallySelected && "bg-primary/50 text-primary-foreground",
          currentlySelected && "bg-primary text-primary-foreground",
          invalid && "bg-destructive text-destructive-foreground",
          isOver && "outline outline-[3px] outline-sky-500",
          currentlySelected && overworked && "bg-orange-500",
        )}
      >
        <p className="w-40 truncate text-wrap text-xs">{projectInfo.title}</p>
      </Card>
    </WithTooltip>
  );
}
