import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { MarkerType } from "@prisma/client";

import { computeUpdatedRank } from "@/lib/utils/sorting/compute-updated-rank";

import { useMarkingSchemeStore } from "../state";
import { AssessmentCriterion } from "../state/store";

import { AssessmentCriterionCard } from "./assessment-criterion-card";
import { FormDivider } from "./form-divider";

export function SortableForm({
  activeMarkerType,
}: {
  activeMarkerType: MarkerType;
}) {
  const {
    flags,
    selectedFlagIndex,
    selectedSubmissionIndex,
    createCriterionAtIndex,
    updateCriterion,
  } = useMarkingSchemeStore((s) => s);
  const [activeCard, setActiveCard] = useState<AssessmentCriterion | null>(
    null,
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // 5px
      },
    }),
  );

  if (
    selectedFlagIndex === undefined ||
    selectedSubmissionIndex === undefined
  ) {
    throw new Error("cannot render if submission not selected");
  }

  function handleNewCriterion(index: number) {
    if (
      selectedFlagIndex === undefined ||
      selectedSubmissionIndex === undefined
    ) {
      throw new Error("cannot render if submission not selected");
    }

    const newCriterion = {
      name: `New Criterion ${assessmentCriteria.length + 1}`,
      description: "",
      weight: 0,
      // rank: (assessmentCriteria[index].rank ?? 1000) / 2,
      rank: computeUpdatedRank(assessmentCriteria, index),
    };

    createCriterionAtIndex(
      selectedFlagIndex,
      selectedSubmissionIndex,
      activeMarkerType,
      newCriterion,
      index,
    );
  }

  const assessmentCriteria = useMemo(
    () =>
      flags[selectedFlagIndex].submissions[selectedSubmissionIndex].components[
        activeMarkerType
      ],
    [flags, selectedFlagIndex, selectedSubmissionIndex, activeMarkerType],
  );

  const itemIds = useMemo(
    () => assessmentCriteria.map((e) => e.id),
    [assessmentCriteria],
  );

  return (
    <DndContext
      sensors={sensors}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <div className="flex h-full w-full flex-col gap-5">
        <FormDivider className="mt-1.5" onClick={() => handleNewCriterion(0)} />
        <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
          {assessmentCriteria.map((e, idx) => (
            <AssessmentCriterionCard
              key={e.id}
              item={e}
              handleNewCriterion={() => handleNewCriterion(idx + 1)}
            />
          ))}
        </SortableContext>
        {createPortal(
          <DragOverlay>
            {activeCard && (
              <AssessmentCriterionCard
                item={activeCard}
                handleNewCriterion={() => console.log("hmm")}
              />
            )}
          </DragOverlay>,
          document.body,
        )}
      </div>
    </DndContext>
  );

  function onDragStart({ active }: DragStartEvent) {
    if (active.data.current) {
      setActiveCard(active.data.current?.item as AssessmentCriterion);
    }
  }

  function onDragEnd({ active, over }: DragEndEvent) {
    if (
      selectedFlagIndex === undefined ||
      selectedSubmissionIndex === undefined
    ) {
      throw new Error("How are you even here?");
    }

    if (!over) return;

    if (active.id === over.id) return;

    const activeIdx = assessmentCriteria.findIndex((c) => c.id === active.id);
    const overIdx = assessmentCriteria.findIndex((c) => c.id === over.id);

    console.log({
      direction: activeIdx < overIdx ? "downward" : "upward",
      activeIdx,
      overIdx,
      beforeArray: assessmentCriteria.map((c) => c.rank),
    });

    let adjustedArray = [...assessmentCriteria];
    if (activeIdx < overIdx) {
      // Remove the active item and shift everything up
      adjustedArray = [
        ...assessmentCriteria.slice(0, activeIdx),
        ...assessmentCriteria.slice(activeIdx + 1),
      ];
    }

    updateCriterion(
      selectedFlagIndex,
      selectedSubmissionIndex,
      activeMarkerType,
      active.id as string,
      {
        ...(active.data.current?.item as unknown as AssessmentCriterion),
        rank: computeUpdatedRank(adjustedArray, overIdx),
      },
    );

    setActiveCard(null);
  }
}
