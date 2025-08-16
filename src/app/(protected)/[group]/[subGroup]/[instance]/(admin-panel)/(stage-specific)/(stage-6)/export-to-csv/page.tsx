import { DatabaseIcon, ZapIcon } from "lucide-react";

import { app, metadataTitle } from "@/config/meta";
import { PAGES } from "@/config/pages";

import { SectionHeading, Heading } from "@/components/heading";
import { PanelWrapper } from "@/components/panel-wrapper";
import { Card, CardContent } from "@/components/ui/card";

import { api } from "@/lib/trpc/server";
import { type InstanceParams } from "@/lib/validations/params";

import { AllocationDataTable } from "./_components/allocation-data-table";
import { ExportDataButton } from "./_components/export-button";

export async function generateMetadata({ params }: { params: InstanceParams }) {
  const { displayName } = await api.institution.instance.get({ params });

  return {
    title: metadataTitle([PAGES.exportToCSV.title, displayName, app.name]),
  };
}

export default async function Page({ params }: { params: InstanceParams }) {
  const data = await api.institution.instance.matching.exportCsvData({
    params,
  });

  return (
    <PanelWrapper className="gap-10">
      <Heading className="mb-4">{PAGES.exportToCSV.title}</Heading>
      <section className="flex w-full flex-col gap-5">
        <SectionHeading icon={ZapIcon}>Quick Actions</SectionHeading>
        <Card>
          <CardContent className="mt-6 flex items-center justify-between gap-10">
            <p>This will export all columns even if they are not in view</p>
            <ExportDataButton data={data} />
          </CardContent>
        </Card>
      </section>
      <section className="flex w-full flex-col gap-5">
        <SectionHeading icon={DatabaseIcon}>All data</SectionHeading>
        <AllocationDataTable data={data} />
      </section>
    </PanelWrapper>
  );
}
