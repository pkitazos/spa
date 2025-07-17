import { Stage } from "@prisma/client";

import { app, metadataTitle } from "@/config/meta";
import { PAGES } from "@/config/pages";

import { AccessControl } from "@/components/access-control";
import { Heading } from "@/components/heading";
import { PanelWrapper } from "@/components/panel-wrapper";
import { TaskCompletionCard } from "@/components/task-completion-card";

import { api } from "@/lib/trpc/server";
import { type InstanceParams } from "@/lib/validations/params";

import { MyProjectsDataTable } from "./_components/my-projects-data-table";

export async function generateMetadata({ params }: { params: InstanceParams }) {
  const { displayName } = await api.institution.instance.get({ params });

  return {
    title: metadataTitle([PAGES.myProjects.title, displayName, app.name]),
  };
}

export default async function Page({ params }: { params: InstanceParams }) {
  const { submissionTarget } = await api.user.supervisor.projectStats({
    params,
  });

  const rowProjects = await api.user.supervisor.rowProjects({ params });
  const uniqueProjectIds = new Set(rowProjects.map((p) => p.project.id));

  return (
    <>
      <Heading>My Projects</Heading>
      <PanelWrapper className="pt-6">
        <AccessControl
          allowedStages={[Stage.PROJECT_SUBMISSION, Stage.STUDENT_BIDDING]}
        >
          <TaskCompletionCard
            title="Submission Target"
            completed={uniqueProjectIds.size}
            total={submissionTarget}
          />
        </AccessControl>
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
    </>
  );
}
