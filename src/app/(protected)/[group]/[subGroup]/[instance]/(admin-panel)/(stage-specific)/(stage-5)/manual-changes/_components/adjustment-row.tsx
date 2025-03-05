"use client";
import { useState } from "react";
import { createPortal } from "react-dom";
import { DndContext, DragEndEvent, DragOverlay } from "@dnd-kit/core";

import {
  addToAllocations,
  getProjectIdx,
  getProjectInfo,
  getStudent,
  removeFromAllocations,
  replaceUpdated,
} from "@/lib/utils/allocation-adjustment";

import { useAllocDetails } from "./allocation-store";
import { ProjectCard } from "./project-card";
import { RowRemovalButton } from "./row-removal-button";
import { StudentCard } from "./student-card";
import { UnmatchButton } from "./unmatch-button";

export function AdjustmentRow({
  rowIdx,
  studentId,
}: {
  rowIdx: number;
  studentId: string;
}) {
  const [dragging, setDragging] = useState(false);

  const allStudents = useAllocDetails((s) => s.students);
  const allProjects = useAllocDetails((s) => s.projects);
  const updateProjects = useAllocDetails((s) => s.updateProjects);

  const rowStudent = getStudent(allStudents, studentId);
  const projects = rowStudent.projects.map((p) =>
    getProjectInfo(allProjects, p.id),
  );

  function onDragEnd({ over }: DragEndEvent) {
    if (!over) return;

    const newProjects = structuredClone(projects);

    const selectedIdx = getProjectIdx(newProjects, studentId);
    const overIdx = newProjects.findIndex((e) => e.id === over.id);

    if (selectedIdx === overIdx) return;

    const overProject = newProjects[overIdx];
    const updatedOver = addToAllocations(overProject, studentId);
    newProjects[overIdx] = updatedOver;

    if (selectedIdx !== -1) {
      const selectedProject = newProjects[selectedIdx];
      const updatedSelected = removeFromAllocations(selectedProject, studentId);
      newProjects[selectedIdx] = updatedSelected;
    }

    const updatedProjects = replaceUpdated(allProjects, newProjects);
    updateProjects(updatedProjects);
    setDragging(false);
  }

  return (
    <DndContext onDragStart={() => setDragging(true)} onDragEnd={onDragEnd}>
      <div className="flex min-h-24 w-max max-w-[65rem] items-start gap-3">
        <div className="my-1.5 flex items-center gap-2 border-r pr-3">
          <UnmatchButton rowIdx={rowIdx} />
          <RowRemovalButton rowIdx={rowIdx} />
          <StudentCard studentId={studentId} />
        </div>
        <div className="flex w-full items-start gap-3 overflow-x-scroll scrollbar-thin scrollbar-track-background scrollbar-thumb-rounded-full">
          {rowStudent.projects.map((p, i) => (
            <ProjectCard key={i} project={p} studentId={studentId} />
          ))}
        </div>
      </div>
      {createPortal(
        <DragOverlay>
          {dragging && <StudentCard studentId={studentId} />}
        </DragOverlay>,
        document.body,
      )}
    </DndContext>
  );
}
