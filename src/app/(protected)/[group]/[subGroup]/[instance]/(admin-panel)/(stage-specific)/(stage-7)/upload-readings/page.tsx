import { AddReadersSection } from "./_components/add-readers-section";

import { SubHeading } from "@/components/heading";
import { PanelWrapper } from "@/components/panel-wrapper";

import { api } from "@/lib/trpc/server";
import { InstanceParams } from "@/lib/validations/params";

import { PAGES } from "@/config/pages";
import { app, metadataTitle } from "@/config/meta";

export async function generateMetadata({ params }: { params: InstanceParams }) {
  const { displayName } = await api.institution.instance.get({ params });

  return {
    title: metadataTitle([PAGES.uploadReadings.title, displayName, app.name]),
  };
}

export default async function Page({ params }: { params: InstanceParams }) {
  return (
    <PanelWrapper className="mt-10">
      <SubHeading className="mb-4">{PAGES.uploadReadings.title}</SubHeading>
      <AddReadersSection />
    </PanelWrapper>
  );
}
