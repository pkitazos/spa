import { DatabaseIcon } from "lucide-react";

import { app, metadataTitle } from "@/config/meta";
import { PAGES } from "@/config/pages";

import { SectionHeading, Heading } from "@/components/heading";
import { PanelWrapper } from "@/components/panel-wrapper";

import { api } from "@/lib/trpc/server";
import { type InstanceParams } from "@/lib/validations/params";

import { LateProjectDataTable } from "./_components/late-project-data-table";

export async function generateMetadata({ params }: { params: InstanceParams }) {
  const { displayName } = await api.institution.instance.get({ params });

  return {
    title: metadataTitle([PAGES.lateProposals.title, displayName, app.name]),
  };
}

export default async function Page({ params }: { params: InstanceParams }) {
  const projects = await api.project.getAllLateProposals({ params });
  const projectDescriptors =
    await api.institution.instance.getAllProjectDescriptors({ params });

  return (
    <PanelWrapper className="gap-16">
      <Heading className="mb-4">{PAGES.lateProposals.title}</Heading>
      <section className="flex w-full flex-col gap-5">
        <SectionHeading icon={DatabaseIcon}>All data</SectionHeading>
        <LateProjectDataTable
          data={projects}
          projectDescriptors={projectDescriptors}
        />
      </section>
    </PanelWrapper>
  );
}
