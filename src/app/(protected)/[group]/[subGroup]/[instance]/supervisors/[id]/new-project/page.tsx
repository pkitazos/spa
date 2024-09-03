import { Stage } from "@prisma/client";

import { Heading } from "@/components/heading";
import { PageWrapper } from "@/components/page-wrapper";
import { CreateProjectForm } from "@/components/pages/create-project-form";
import { Unauthorised } from "@/components/unauthorised";

import { api } from "@/lib/trpc/server";
import { makeRequiredFlags } from "@/lib/utils/general/make-required-flags";
import { stageGt } from "@/lib/utils/permissions/stage-check";
import { InstanceParams } from "@/lib/validations/params";

import { app, metadataTitle } from "@/content/config/app";
import { pages } from "@/content/pages";

type PageParams = InstanceParams & { id: string };

export async function generateMetadata({ params }: { params: PageParams }) {
  const { displayName } = await api.institution.instance.get({ params });
  const { name } = await api.user.getById({ userId: params.id });

  return {
    title: metadataTitle([
      pages.newProject.title,
      name,
      pages.allSupervisors.title,
      displayName,
      app.name,
    ]),
  };
}

export default async function Page({ params }: { params: PageParams }) {
  const stage = await api.institution.instance.currentStage({ params });
  if (stageGt(stage, Stage.PROJECT_SELECTION)) {
    return (
      <Unauthorised message="You can't access this resource at this time" />
    );
  }

  const supervisor = await api.user.getById({ userId: params.id });
  const formDetails = await api.project.getFormDetails({ params });
  const instanceFlags = await api.institution.instance.getFlags({ params });
  const requiredFlags = makeRequiredFlags(instanceFlags);

  return (
    <PageWrapper>
      <Heading className="flex items-baseline gap-6">
        <p>{pages.newProject.title}</p>
        <p className="text-3xl text-muted-foreground">for {supervisor.name}</p>
      </Heading>
      <CreateProjectForm
        formInternalData={formDetails}
        supervisor={supervisor}
        requiredFlags={requiredFlags}
        createdByAdmin
      />
    </PageWrapper>
  );
}