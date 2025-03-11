import { Heading } from "@/components/heading";
import { PanelWrapper } from "@/components/panel-wrapper";

import { api } from "@/lib/trpc/server";
import { InstanceParams } from "@/lib/validations/params";

import { app, metadataTitle } from "@/config/meta";
import { PAGES } from "@/config/pages";
import { SubmissionsTable } from "./_components/submissions-table";

export async function generateMetadata({ params }: { params: InstanceParams }) {
  const { displayName } = await api.institution.instance.get({ params });

  return {
    title: metadataTitle([PAGES.myMarking.title, displayName, app.name]),
  };
}

export default async function Page({ params }: { params: InstanceParams }) {
  const data = await api.user.marker.getProjectsToMark({ params });

  return (
    <>
      <Heading>My Marking</Heading>
      <PanelWrapper className="pt-6">
        <SubmissionsTable data={data} />
      </PanelWrapper>
    </>
  );
}
