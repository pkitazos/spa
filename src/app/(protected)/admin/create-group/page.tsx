import { type Metadata } from "next";

import { app, metadataTitle } from "@/config/meta";
import { PAGES } from "@/config/pages";
import { spacesLabels } from "@/config/spaces";

import { Heading } from "@/components/heading";
import { PanelWrapper } from "@/components/panel-wrapper";

import { api } from "@/lib/trpc/server";

import { FormSection } from "./_components/form-section";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: metadataTitle([PAGES.newGroup.title, app.institution.name, app.name]),
};

export default async function Page() {
  const takenGroupNames = await api.institution.takenGroupNames();

  return (
    <PanelWrapper className="mt-5 gap-10">
      <Heading className="text-4xl">
        Create new {spacesLabels.group.full}
      </Heading>
      <FormSection takenGroupNames={takenGroupNames} />
    </PanelWrapper>
  );
}
