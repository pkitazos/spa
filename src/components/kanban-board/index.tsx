"use client";

import { useState } from "react";
import { createPortal } from "react-dom";

import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { z } from "zod";

import { PreferenceType } from "@/db/types";

import {
  PREFERENCE_BOARD_COLUMNS,
  PROJECT_PREFERENCE_CARD,
  projectPreferenceCardDtoSchema,
  type ProjectPreferenceCardDto,
} from "@/lib/validations/board";

import { ColumnContainer } from "./column-container";
import { ProjectPreferenceCard } from "./project-preference-card";
import { useBoardDetails } from "./store";

type ReorderFunction = (
  projectId: string,
  updatedRank: number,
  preferenceType: PreferenceType,
) => Promise<void>;

type DeleteFunction = (projectId: string) => Promise<void>;

export function KanbanBoard({
  reorderPreference,
  deletePreference,
}: {
  reorderPreference: ReorderFunction;
  deletePreference: DeleteFunction;
}) {
  const projects = useBoardDetails((s) => s.projects);
  const moveProject = useBoardDetails((s) => s.moveProject);

  const [activeProject, setActiveProject] =
    useState<ProjectPreferenceCardDto | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // 5px
      },
    }),
  );

  function onDragStart({ active }: DragStartEvent) {
    if (active.data.current?.type === PROJECT_PREFERENCE_CARD) {
      setActiveProject(
        projectPreferenceCardDtoSchema.parse(active.data.current.project),
      );
    }
  }

  /**
   * @description
   * this function is called when the drag event ends
   * it checks if the dragged item is dropped over another item or column
   * if it is dropped over another item, it will reorder the items
   * if it is dropped over a column, it will move the item to that column at the bottom
   */
  function onDragEnd({ active, over }: DragEndEvent) {
    // if there is no over, it means the item is not dropped over anything
    // so we can just return
    if (!over) return;

    // if the active item is the same as the over item, it means the item is dropped
    // over itself, so we can just return
    if (active.id === over.id) return;

    // check if the active item and over item are cards or columns
    const isActiveCard = active.data.current?.type === PROJECT_PREFERENCE_CARD;
    const isOverCard = over.data.current?.type === PROJECT_PREFERENCE_CARD;

    // if the active item is not a card, we can just return
    if (!isActiveCard) return;

    // find the columnId of the active and over items
    const activeColumnId = z
      .enum(PreferenceType)
      .parse(active.data.current?.columnId);

    // if the over item is a column the over id will be the columnId
    const overColumnId = z
      .enum(PreferenceType)
      .parse(isOverCard ? over.data.current?.columnId : over.id);

    const {
      id: projectId,
      rank,
      columnId: newType,
    } = moveProject(
      {
        columnId: activeColumnId,
        idx: projects[activeColumnId].findIndex((e) => e.id === active.id),
      },
      {
        columnId: overColumnId,
        idx: isOverCard
          ? projects[overColumnId].findIndex((e) => e.id === over.id)
          : undefined,
      },
    );

    // perform the re-ordering mutation
    // it just updates the rank of the active item to the new computed rank
    void reorderPreference(projectId, rank, newType);

    setActiveProject(null);
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <div className="flex h-full w-full gap-5">
        {PREFERENCE_BOARD_COLUMNS.map((column) => (
          <ColumnContainer
            key={column.id}
            column={column}
            deletePreference={deletePreference}
          />
        ))}
        {createPortal(
          <DragOverlay>
            {activeProject && (
              <ProjectPreferenceCard
                project={activeProject}
                deletePreference={deletePreference}
              />
            )}
          </DragOverlay>,
          document.body,
        )}
      </div>
    </DndContext>
  );
}
