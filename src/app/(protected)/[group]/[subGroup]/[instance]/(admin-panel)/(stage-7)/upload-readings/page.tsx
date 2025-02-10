import { Stage } from "@prisma/client";
import { AddReadersSection } from "./_components/add-readers-section";

import { AccessControl } from "@/components/access-control";
import { Heading, SubHeading } from "@/components/heading";
import { PanelWrapper } from "@/components/panel-wrapper";

import { api } from "@/lib/trpc/server";
import { InstanceParams } from "@/lib/validations/params";

import { app, metadataTitle } from "@/content/config/app";
import { pages } from "@/content/pages";

export async function generateMetadata({ params }: { params: InstanceParams }) {
  const { displayName } = await api.institution.instance.get({ params });

  return {
    title: metadataTitle([pages.uploadReadings.title, displayName, app.name]),
  };
}

export default async function Page({ params }: { params: InstanceParams }) {
  return (
    <PanelWrapper className="mt-10">
      <SubHeading className="mb-4">{pages.uploadReadings.title}</SubHeading>
      <AddReadersSection />
    </PanelWrapper>
  );
}
