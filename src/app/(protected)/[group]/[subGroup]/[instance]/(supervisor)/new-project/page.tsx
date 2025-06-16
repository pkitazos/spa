import { Heading } from "@/components/heading";
import { CreateProjectForm } from "@/components/project-form/create-project";
import { Unauthorised } from "@/components/unauthorised";

import { api } from "@/lib/trpc/server";
import { stageGt } from "@/lib/utils/permissions/stage-check";
import { InstanceParams } from "@/lib/validations/params";

import { app, metadataTitle } from "@/config/meta";
import { PAGES } from "@/config/pages";
import { Role, Stage } from "@/db/types";
import { PageWrapper } from "@/components/page-wrapper";

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
  const formDetails = await api.project.getFormDetails({ params });

  return (
    <PageWrapper>
      <Heading>{PAGES.newProject.title}</Heading>
      <CreateProjectForm
        formInitialisationData={formDetails}
        userRole={Role.SUPERVISOR}
        currentUserId={supervisor.id}
      />
    </PageWrapper>
  );
}
