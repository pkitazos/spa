import { DatabaseIcon } from "lucide-react";

import { app, metadataTitle } from "@/config/meta";
import { PAGES } from "@/config/pages";

import { Heading, SectionHeading } from "@/components/heading";
import { PanelWrapper } from "@/components/panel-wrapper";

import { api } from "@/lib/trpc/server";
import { type InstanceParams } from "@/lib/validations/params";

import { PreAllocatedProjectDataTable } from "./_components/pre-allocated-project-data-table";

export async function generateMetadata({ params }: { params: InstanceParams }) {
  const { displayName } = await api.institution.instance.get({ params });

  return {
    title: metadataTitle([
      PAGES.preAllocatedProjects.title,
      displayName,
      app.name,
    ]),
  };
}

export default async function Page({ params }: { params: InstanceParams }) {
  const preAllocations = await api.project.getAllPreAllocated({ params });
  const projectDescriptors =
    await api.institution.instance.getUsedProjectDescriptors({ params });

  return (
    <PanelWrapper className="gap-16">
      <Heading className="mb-4">{PAGES.preAllocatedProjects.title}</Heading>
      <section className="flex w-full flex-col gap-5">
        <SectionHeading className="flex items-center">
          <DatabaseIcon className="mr-2 h-6 w-6 text-indigo-500" />
          <span>All data</span>
        </SectionHeading>
        <PreAllocatedProjectDataTable
          data={preAllocations}
          projectDescriptors={projectDescriptors}
        />
      </section>
    </PanelWrapper>
  );
}
