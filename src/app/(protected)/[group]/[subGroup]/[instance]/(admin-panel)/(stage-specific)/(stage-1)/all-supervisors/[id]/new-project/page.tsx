import { app, metadataTitle } from "@/config/meta";
import { PAGES } from "@/config/pages";

import { Role, Stage } from "@/db/types";

import { Heading } from "@/components/heading";
import { PanelWrapper } from "@/components/panel-wrapper";
import { ProjectCreationManager } from "@/components/project-creation-manager";
import { Unauthorised } from "@/components/unauthorised";

import { api } from "@/lib/trpc/server";
import { stageGt } from "@/lib/utils/permissions/stage-check";
import { type InstanceParams } from "@/lib/validations/params";

type PageParams = InstanceParams & { id: string };

export async function generateMetadata({ params }: { params: PageParams }) {
  const { displayName } = await api.institution.instance.get({ params });
  const { name } = await api.user.getById({ userId: params.id });

  return {
    title: metadataTitle([
      PAGES.newSupervisorProject.title,
      name,
      PAGES.allSupervisors.title,
      displayName,
      app.name,
    ]),
  };
}

export default async function Page({ params }: { params: PageParams }) {
  const stage = await api.institution.instance.currentStage({ params });
  if (stageGt(stage, Stage.STUDENT_BIDDING)) {
    return (
      <Unauthorised message="You can't access this resource at this time" />
    );
  }

  const user = await api.user.get();
  const supervisor = await api.user.getById({ userId: params.id });
  const formInitData = await api.project.getFormInitialisationData({ params });

  const previousProjectData = await api.user.supervisor.getPreviousProjects({
    params,
    supervisorId: supervisor.id,
  });

  return (
    <PanelWrapper>
      <Heading className="flex items-baseline gap-6">
        <p>{PAGES.newSupervisorProject.title}</p>
        <p className="text-3xl text-muted-foreground">for {supervisor.name}</p>
      </Heading>
      <ProjectCreationManager
        previousProjectData={previousProjectData}
        projectCreationContext={formInitData}
        onBehalfOf={supervisor.id}
        userRole={Role.ADMIN}
        currentUserId={user.id}
        showSupervisorCol={false}
        showSupervisorSelector={false}
      />
    </PanelWrapper>
  );
}
