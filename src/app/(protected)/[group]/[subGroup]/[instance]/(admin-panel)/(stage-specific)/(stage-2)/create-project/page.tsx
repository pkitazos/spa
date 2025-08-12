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
    title: metadataTitle([PAGES.createProject.title, displayName, app.name]),
  };
}

export default async function Page({ params }: { params: InstanceParams }) {
  const stage = await api.institution.instance.currentStage({ params });
  if (stageGt(stage, Stage.ALLOCATION_ADJUSTMENT)) {
    return (
      <Unauthorised message="You can't access this resource at this time" />
    );
  }

  const user = await api.user.get();
  const formInitData = await api.project.getFormInitialisationData({ params });

  // todo: fetch all projects by every supervisor, from every instance in the allocation group

  return (
    <PanelWrapper>
      <Heading className="flex items-baseline gap-4">
        <p>{PAGES.createProject.title}</p>
        <p className="text-3xl text-muted-foreground">for supervisor</p>
      </Heading>
      <ProjectCreationManager
        previousProjectData={[]}
        formInitialisationData={formInitData}
        userRole={Role.ADMIN}
        currentUserId={user.id}
      />
    </PanelWrapper>
  );
}
