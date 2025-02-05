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
import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useMarkingSchemeStore } from "../state";
import { AssessmentCriterionCard } from "./assessment-criterion-card";
import { AssessmentCriterion } from "../state/store";
import { computeUpdatedRank } from "@/lib/utils/sorting/compute-updated-rank";

export function SortableForm({
  activeMarkerType,
}: {
  activeMarkerType: MarkerType;
}) {
  const { flags, selectedFlagIndex, selectedSubmissionIndex, updateCriterion } =
    useMarkingSchemeStore((s) => s);
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

  const assessmentCriteria = useMemo(
    () =>
      flags[selectedFlagIndex].submissions[selectedSubmissionIndex].components[
        activeMarkerType
      ],
    [flags, selectedFlagIndex, selectedSubmissionIndex, activeMarkerType],
  );

  console.log(assessmentCriteria);
  return (
    <DndContext
      sensors={sensors}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <div className="flex h-full w-full flex-col gap-5">
        <div>Hello</div>
        <SortableContext
          strategy={verticalListSortingStrategy}
          items={assessmentCriteria.map((e) => e.id)}
        >
          {assessmentCriteria.map((e, i) => (
            <AssessmentCriterionCard key={e.id} item={e} />
          ))}
        </SortableContext>

        {createPortal(
          <DragOverlay>
            {activeCard && <AssessmentCriterionCard item={activeCard} />}
          </DragOverlay>,
          document.body,
        )}
      </div>
    </DndContext>
  );

  function onDragStart({ active }: DragStartEvent) {
    console.log("this is on");
    if (active.data.current) {
      setActiveCard(active.data.current as any);
    }
  }

  function onDragEnd({ active, over }: DragEndEvent) {
    if (
      selectedFlagIndex === undefined ||
      selectedSubmissionIndex === undefined
    ) {
      throw new Error("TGC");
    }

    if (!over) return;
    console.log("over is", over);

    // if the active item is the same as the over item, it means the item is dropped
    // over itself, so we can just return
    if (active.id === over.id) return;

    console.log("active is", active);

    const overIdx = assessmentCriteria.findIndex((c) => c.id === over.id);

    updateCriterion(
      selectedFlagIndex,
      selectedSubmissionIndex,
      activeMarkerType,
      active.id as string,
      {
        ...(active.data as unknown as AssessmentCriterion),
        rank: computeUpdatedRank(assessmentCriteria, overIdx),
      },
    );

    setActiveCard(null);
  }
}
