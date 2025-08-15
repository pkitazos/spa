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

export async function generateMetadata({ params }: { params: InstanceParams }) {
  const { displayName } = await api.institution.instance.get({ params });

  return {
    title: metadataTitle([PAGES.newProject.title, displayName, app.name]),
  };
}

export default async function Page({ params }: { params: InstanceParams }) {
  const stage = await api.institution.instance.currentStage({ params });

  if (stageGt(stage, Stage.STUDENT_BIDDING)) {
    return (
      <Unauthorised message="You really should not be submitting projects at this stage" />
    );
  }

  const supervisor = await api.user.get();
  const userRoles = await api.user.roles({ params });
  const formInitData = await api.project.getFormInitialisationData({ params });

  const previousProjectData = await api.user.supervisor.getPreviousProjects({
    params,
    supervisorId: supervisor.id,
  });

  return (
    <PanelWrapper className="gap-10">
      <Heading>{PAGES.newProject.title}</Heading>
      <ProjectCreationManager
        previousProjectData={previousProjectData}
        projectCreationContext={formInitData}
        onBehalfOf={supervisor.id}
        userRole={userRoles.has(Role.ADMIN) ? Role.ADMIN : Role.SUPERVISOR}
        showSupervisorSelector={false}
        showSupervisorCol={false}
        currentUserId={supervisor.id}
      />
    </PanelWrapper>
  );
}
