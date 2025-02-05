"use client";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVerticalIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { cn } from "@/lib/utils";

import { AssessmentCriterion } from "../state/store";

export function AssessmentCriterionCard({
  item,
}: {
  item: AssessmentCriterion;
}) {
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({
    id: item.id,
    data: { item },
  });

  const style = { transition, transform: CSS.Transform.toString(transform) };

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className={cn("h-[7.5rem] rounded-md bg-muted-foreground/20")}
      />
    );
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-center",
        isOver && "outline outline-4 outline-muted-foreground/50",
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
        <CardHeader className="flex w-full flex-row items-center justify-between space-y-0 p-4 pb-2">
          <CardTitle className="text-sm font-medium">{item.name}</CardTitle>
        </CardHeader>
        <CardContent className="pl-8">
          <div className="flex items-center">
            <span className="font-medium">{item.description}</span>
            <span className="font-medium">weight: {item.weight}</span>
            <span className="font-medium">rank: {item.rank}</span>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}
