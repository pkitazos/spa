"use client";
import { Stage } from "@prisma/client";
import { useParams } from "next/navigation";

import { AccessControl } from "@/components/access-control";
import { BoardDetailsProvider } from "@/components/kanban-board/store";
import { Card, CardContent } from "@/components/ui/card";

import { PreferenceBoard } from "@/lib/validations/board";
import { NewStudentProjectDto } from "@/lib/validations/dto/project";
import { PageParams } from "@/lib/validations/params";

import { KanbanBoardSection } from "./kanban-board-section";
import { NewPreferenceButton } from "./new-preference-button";

export function CurrentBoardState({
  availableProjects,
  initialProjects,
}: {
  availableProjects: NewStudentProjectDto[];
  initialProjects: PreferenceBoard;
}) {
  const params = useParams<PageParams>();
  return (
    <BoardDetailsProvider projects={initialProjects}>
      <section className="flex w-full max-w-7xl flex-col">
        <AccessControl allowedStages={[Stage.STUDENT_BIDDING]}>
          <Card className="my-4">
            <CardContent className="flex items-center justify-between pt-6">
              <p className="font-medium">
                Add new project to student preferences
              </p>
              <NewPreferenceButton availableProjects={availableProjects} />
            </CardContent>
          </Card>
        </AccessControl>
        <KanbanBoardSection studentId={params.id} />
      </section>
    </BoardDetailsProvider>
  );
}
