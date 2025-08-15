import { app, metadataTitle } from "@/config/meta";
import { PAGES } from "@/config/pages";

import { Stage } from "@/db/types";

import { ConditionalRender } from "@/components/access-control";
import { Heading } from "@/components/heading";
import { PanelWrapper } from "@/components/panel-wrapper";
import { TaskCompletionCard } from "@/components/task-completion-card";

import { api } from "@/lib/trpc/server";
import { type InstanceParams } from "@/lib/validations/params";

import { MyProjectsDataTable } from "./_components/my-projects-data-table";

export async function generateMetadata({ params }: { params: InstanceParams }) {
  const { displayName } = await api.institution.instance.get({ params });

  return {
    title: metadataTitle([
      PAGES.myProposedProjects.title,
      displayName,
      app.name,
    ]),
  };
}

export default async function Page({ params }: { params: InstanceParams }) {
  const { submissionTarget } = await api.user.supervisor.projectStats({
    params,
  });

  const rowProjects = await api.user.supervisor.rowProjects({ params });
  const uniqueProjectIds = new Set(rowProjects.map((p) => p.project.id));

  return (
    <PanelWrapper className="gap-10">
      <Heading>{PAGES.myProposedProjects.title}</Heading>
      <ConditionalRender
        allowedStages={[Stage.PROJECT_SUBMISSION, Stage.STUDENT_BIDDING]}
        allowed={
          // TODO: this looks a bit silly now after a supervisor has reached their target
          <TaskCompletionCard
            title="Submission Target"
            completed={uniqueProjectIds.size}
            total={submissionTarget}
          />
        }
      />
      <MyProjectsDataTable
        projects={rowProjects.map((r) => ({
          id: r.project.id,
          title: r.project.title,
          capacityUpperBound: r.project.capacityUpperBound,
          allocatedStudentId: r.student?.id,
          allocatedStudentName: r.student?.name,
        }))}
      />
    </PanelWrapper>
  );
}
