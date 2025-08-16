"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVerticalIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { cn } from "@/lib/utils";

import { type AssessmentCriterion } from "../state/store";

import { AssessmentCriterionForm } from "./assessment-criterion-form";
import { FormDivider } from "./form-divider";

export function AssessmentCriterionCard({
  item,
  handleNewCriterion,
}: {
  item: AssessmentCriterion;
  handleNewCriterion: () => void;
}) {
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({ id: item.id, data: { item } });

  const style = { transition, transform: CSS.Transform.toString(transform) };

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className={cn("h-30 rounded-md bg-muted-foreground/20")}
      />
    );
  }

  return (
    <>
      <Card
        ref={setNodeRef}
        style={style}
        className={cn(
          "group flex items-center pt-5",
          isOver && "outline-solid outline-4 outline-muted-foreground/50",
        )}
      >
        <Button
          {...attributes}
          {...listeners}
          variant="ghost"
          className="ml-2 flex h-20 w-8 flex-col"
        >
          <GripVerticalIcon className="-mb-1 h-8 w-8 cursor-move text-gray-400/50" />
          <GripVerticalIcon className="h-8 w-8 cursor-move text-gray-400/50" />
        </Button>

        <div>
          <CardContent className="pl-8">
            <AssessmentCriterionForm defaultValues={item} />
          </CardContent>
        </div>
      </Card>
      <FormDivider onClick={handleNewCriterion} />
    </>
  );
}
