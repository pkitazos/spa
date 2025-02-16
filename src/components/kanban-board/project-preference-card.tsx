"use client";
import { Fragment } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { PreferenceType, Stage } from "@prisma/client";
import { GripVerticalIcon, XIcon } from "lucide-react";
import Link from "next/link";

import { AccessControl } from "@/components/access-control";
import { useInstancePath, useInstanceStage } from "@/components/params-context";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { cn } from "@/lib/utils";
import { stageGte } from "@/lib/utils/permissions/stage-check";
import {
  PROJECT_PREFERENCE_CARD,
  ProjectPreferenceCardDto,
} from "@/lib/validations/board";

import { Badge } from "../ui/badge";
import { WithTooltip } from "../ui/tooltip-wrapper";

export function ProjectPreferenceCard({
  project,
  rank,
  deletePreference,
}: {
  project: ProjectPreferenceCardDto;
  rank?: number;
  deletePreference: (id: string) => Promise<void>;
}) {
  const stage = useInstanceStage();
  const instancePath = useInstancePath();

  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({
    id: project.id,
    data: {
      type: PROJECT_PREFERENCE_CARD,
      project,
      columnId: project.columnId,
    },
    disabled: stageGte(stage, Stage.PROJECT_ALLOCATION),
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

  const Comp = project.title.length > 34 ? WithTooltip : Fragment;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-center",
        isOver && "outline outline-4 outline-muted-foreground/50",
      )}
    >
      <AccessControl allowedStages={[Stage.STUDENT_BIDDING]}>
        <Button
          {...attributes}
          {...listeners}
          variant="ghost"
          className="ml-2 flex h-20 w-8 flex-col"
        >
          <GripVerticalIcon className="-mb-1 h-8 w-8 cursor-move text-gray-400/50" />
          <GripVerticalIcon className="h-8 w-8 cursor-move text-gray-400/50" />
        </Button>
      </AccessControl>
      <div>
        <CardHeader className="flex w-full flex-row items-center justify-between space-y-0 p-4 pb-2">
          {project.columnId === PreferenceType.PREFERENCE && rank && (
            <Badge
              variant="accent"
              className="mr-2 h-8 w-8 rounded-full text-lg text-secondary"
            >
              {rank}
            </Badge>
          )}
          <CardTitle className="text-sm font-medium">
            <Comp tip={<p className="max-w-96">{project.title}</p>}>
              <Link
                className={cn(
                  buttonVariants({ variant: "link" }),
                  "inline-block w-80 truncate px-0 text-start text-lg",
                )}
                href={`${instancePath}/projects/${project.id}`}
              >
                {project.title}
              </Link>
            </Comp>
          </CardTitle>
          <AccessControl allowedStages={[Stage.STUDENT_BIDDING]}>
            <Button
              variant="ghost"
              size="icon"
              className="invisible items-center justify-center group-hover:visible group-hover:flex"
              onClick={() => deletePreference(project.id)}
            >
              <XIcon className="h-4 w-4 font-bold" />
            </Button>
          </AccessControl>
        </CardHeader>
        <CardContent className="pl-8">
          <div className="flex items-center">
            <span className="mr-2 text-sm text-gray-500">Supervisor:</span>
            <span className="font-medium">{project.supervisor.name}</span>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}
