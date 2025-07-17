import { DatabaseIcon } from "lucide-react";

import { app, metadataTitle } from "@/config/meta";
import { PAGES } from "@/config/pages";

import { SectionHeading, SubHeading } from "@/components/heading";
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

  return (
    <PanelWrapper className="mt-10 flex flex-col items-start gap-16 px-12">
      <SubHeading className="mb-4">{PAGES.lateProposals.title}</SubHeading>
      <section className="flex w-full flex-col gap-5">
        <SectionHeading className="flex items-center">
          <DatabaseIcon className="mr-2 h-6 w-6 text-indigo-500" />
          <span>All data</span>
        </SectionHeading>
        <LateProjectDataTable data={projects} />
      </section>
    </PanelWrapper>
  );
}
