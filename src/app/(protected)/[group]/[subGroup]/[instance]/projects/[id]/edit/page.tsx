import { Heading } from "@/components/heading";
import { PageWrapper } from "@/components/page-wrapper";
import { Unauthorised } from "@/components/unauthorised";

import { api } from "@/lib/trpc/server";
import { toPP1 } from "@/lib/utils/general/instance-params";
import { stageGte } from "@/lib/utils/permissions/stage-check";
import { InstanceParams } from "@/lib/validations/params";

import { Role, Stage } from "@/db/types";
import { EditProjectForm } from "@/components/project-form/edit-project";
import { ProjectFormInitialisationData } from "@/lib/validations/project-form";
import { PAGES } from "@/config/pages";
import { app, metadataTitle } from "@/config/meta";

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

  const formInternalData = await api.project.getFormDetails({
    params,
    projectId,
  });

  const formInitialisationData: ProjectFormInitialisationData = {
    ...formInternalData,
    currentProject: {
      id: project.id,
      title: project.title,
      description: project.description,
      flagIds: project.flags.map((flag) => flag.id),
      tagIds: project.tags.map((tag) => tag.id),
      supervisorId: supervisor.id,
      capacityUpperBound: project.capacityUpperBound,
      preAllocatedStudentId: project.preAllocatedStudentId,
    },
  };

  return (
    <PageWrapper>
      <Heading>{PAGES.editProject.title}</Heading>
      <EditProjectForm
        formInitialisationData={formInitialisationData}
        userRole={roles.has(Role.ADMIN) ? Role.ADMIN : Role.SUPERVISOR}
        currentUserId={user.id}
        projectId={projectId}
      />
    </PageWrapper>
  );
}
