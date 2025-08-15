import { app, metadataTitle } from "@/config/meta";
import { PAGES } from "@/config/pages";

import { Role, Stage } from "@/db/types";

import { Heading } from "@/components/heading";
import { PanelWrapper } from "@/components/panel-wrapper";
import { EditProjectForm } from "@/components/project-form/edit-project";
import { Unauthorised } from "@/components/unauthorised";

import { api } from "@/lib/trpc/server";
import { toPP1 } from "@/lib/utils/general/instance-params";
import { stageGte } from "@/lib/utils/permissions/stage-check";
import { type InstanceParams } from "@/lib/validations/params";

type PageParams = InstanceParams & { id: string };

export async function generateMetadata({ params }: { params: InstanceParams }) {
  const { displayName } = await api.institution.instance.get({ params });

  return {
    title: metadataTitle([PAGES.editProject.title, displayName, app.name]),
  };
}

export default async function Page({ params }: { params: PageParams }) {
  const projectId = params.id;

  const user = await api.user.get();
  const roles = await api.user.roles({ params });
  const stage = await api.institution.instance.currentStage({ params });

  const { project, supervisor } = await api.project.getByIdWithSupervisor({
    params: toPP1(params),
  });

  if (!roles.has(Role.ADMIN) && user.id !== supervisor.id) {
    return (
      <Unauthorised message="You need to be an Admin to access this page" />
    );
  }

  if (stageGte(stage, Stage.PROJECT_ALLOCATION)) {
    return (
      <Unauthorised message="You are not allowed to edit projects at this time" />
    );
  }

  const formInitData = await api.project.getFormInitialisationData({
    params,
    projectId,
  });

  return (
    <PanelWrapper>
      <Heading>{PAGES.editProject.title}</Heading>
      <EditProjectForm
        initialData={project}
        projectCreationContext={formInitData}
        userRole={roles.has(Role.ADMIN) ? Role.ADMIN : Role.SUPERVISOR}
        currentUserId={user.id}
        projectId={projectId}
      />
    </PanelWrapper>
  );
}
