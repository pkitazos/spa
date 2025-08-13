"use client";

import { useMemo } from "react";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext } from "@dnd-kit/sortable";
import { ListIcon, ListOrderedIcon } from "lucide-react";

import { PreferenceType, Stage } from "@/db/types";

import { useInstanceStage } from "@/components/params-context";

import { cn } from "@/lib/utils";
import { stageGte } from "@/lib/utils/permissions/stage-check";
import { PROJECT_PREFERENCE_COLUMN } from "@/lib/validations/board";

import { SectionHeading } from "../heading";

import { ProjectPreferenceCard } from "./project-preference-card";
import { useBoardDetails } from "./store";

export function ColumnContainer({
  column,
  deletePreference,
}: {
  column: { id: PreferenceType; displayName: string };
  deletePreference: (id: string) => Promise<void>;
}) {
  const stage = useInstanceStage();

  const projects = useBoardDetails((s) => s.projects[column.id]);
  const projectIds = useMemo(() => projects.map((e) => e.id), [projects]);

  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: { type: PROJECT_PREFERENCE_COLUMN, column },
    disabled: stageGte(stage, Stage.PROJECT_ALLOCATION),
  });

  const Icon =
    column.id === PreferenceType.PREFERENCE ? ListOrderedIcon : ListIcon;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex h-full min-h-40 w-full flex-col gap-4 rounded-md bg-accent/50 px-3.5 pb-32 shadow-xs",
        isOver && "outline-solid outline-4 outline-muted-foreground/50",
      )}
    >
      <SectionHeading icon={Icon} className="mx-3 mb-3 mt-5">
        {column.displayName}
      </SectionHeading>
      <SortableContext items={projectIds}>
        {projects.map((e, i) => (
          <ProjectPreferenceCard
            key={e.id}
            project={e}
            rank={i + 1}
            deletePreference={deletePreference}
          />
        ))}
      </SortableContext>
    </div>
  );
}
