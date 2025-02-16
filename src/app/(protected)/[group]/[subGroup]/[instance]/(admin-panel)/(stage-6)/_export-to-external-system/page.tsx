import { SubHeading } from "@/components/heading";
import { PanelWrapper } from "@/components/panel-wrapper";
import { NoteCard } from "@/components/ui/note-card";

import { api } from "@/lib/trpc/server";
import { InstanceParams } from "@/lib/validations/params";

import { CreateProjectsSection } from "./_components/send-allocations";

import { app, metadataTitle } from "@/config/meta";
import { PAGES } from "@/config/pages";

export async function generateMetadata({ params }: { params: InstanceParams }) {
  const { displayName } = await api.institution.instance.get({ params });

  return {
    title: metadataTitle([
      PAGES.exportToExternalSystem.title,
      displayName,
      app.name,
    ]),
  };
}

export default async function Page({ params }: { params: InstanceParams }) {
  console.log(params);
  return (
    <PanelWrapper className="flex flex-col items-center justify-center gap-5 pt-8">
      <NoteCard>
        Include note card here explaining the steps/what will happen?
      </NoteCard>
      <SubHeading className="mt-3">
        Check users exist on Assessment System
      </SubHeading>
      <SubHeading className="mt-16">
        Create Projects on Assessment System
      </SubHeading>
      <CreateProjectsSection />
    </PanelWrapper>
  );
}
