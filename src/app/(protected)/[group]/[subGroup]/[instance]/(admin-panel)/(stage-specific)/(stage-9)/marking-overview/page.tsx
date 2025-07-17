import { metadataTitle, app } from "@/config/meta";
import { PAGES } from "@/config/pages";

import { Heading } from "@/components/heading";
import { PanelWrapper } from "@/components/panel-wrapper";

import { api } from "@/lib/trpc/server";
import { type InstanceParams } from "@/lib/validations/params";

import { MarkingOverviewTable } from "./marking-overview-table";

export async function generateMetadata({ params }: { params: InstanceParams }) {
  const { displayName } = await api.institution.instance.get({ params });

  return {
    title: metadataTitle([PAGES.markingOverview.title, displayName, app.name]),
  };
}

export default async function Page({ params }: { params: InstanceParams }) {
  const data = await api.marking.byProjectMarkingSummary({ params });

  return (
    <PanelWrapper className="gap-10">
      <Heading>{PAGES.markingOverview.title}</Heading>
      <MarkingOverviewTable data={data} />
    </PanelWrapper>
  );
}
