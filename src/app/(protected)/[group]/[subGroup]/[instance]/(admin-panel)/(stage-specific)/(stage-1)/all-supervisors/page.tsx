import { app, metadataTitle } from "@/config/meta";
import { PAGES } from "@/config/pages";

import { Heading } from "@/components/heading";
import { PanelWrapper } from "@/components/panel-wrapper";

import { api } from "@/lib/trpc/server";
import { type InstanceParams } from "@/lib/validations/params";

import { SupervisorsDataTable } from "./_components/all-supervisors-data-table";

export async function generateMetadata({ params }: { params: InstanceParams }) {
  const { displayName } = await api.institution.instance.get({ params });

  return {
    title: metadataTitle([PAGES.allSupervisors.title, displayName, app.name]),
  };
}

export default async function Page({ params }: { params: InstanceParams }) {
  const roles = await api.user.roles({ params });
  const data = await api.institution.instance.supervisors({ params });

  return (
    <PanelWrapper>
      <Heading>{PAGES.allSupervisors.title}</Heading>
      <SupervisorsDataTable roles={roles} data={data} />
    </PanelWrapper>
  );
}
