"use client";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

import { Card } from "@/components/ui/card";
import { WithTooltip } from "@/components/ui/tooltip-wrapper";

import { getStudent } from "@/lib/utils/allocation-adjustment";

import { useAllocDetails } from ".";

export function StudentCard({ studentId }: { studentId: string }) {
  const allStudents = useAllocDetails((s) => s.students);

  const { student } = getStudent(allStudents, studentId);

  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: studentId,
    });

  const style = { transform: CSS.Transform.toString(transform) };

  if (isDragging) {
    return (
      <Card
        ref={setNodeRef}
        className="h-20 w-32 bg-secondary/50 px-5 py-3 text-secondary-foreground"
      >
        <p className="max-w-[124px] overflow-hidden">{studentId}</p>
      </Card>
    );
  }

  return (
    <WithTooltip
      tip={
        <div className="p-2">
          <p className="text-base font-medium tracking-tight">{studentId}</p>
          <p className="text-muted-foreground">{student.name}</p>
        </div>
      }
    >
      <Card
        ref={setNodeRef}
        className="grid h-20 w-32 place-items-center bg-secondary px-5 py-3 text-secondary-foreground"
        style={style}
        {...attributes}
        {...listeners}
      >
        <p className="max-w-[124px] overflow-hidden">{studentId}</p>
      </Card>
    </WithTooltip>
  );
}
