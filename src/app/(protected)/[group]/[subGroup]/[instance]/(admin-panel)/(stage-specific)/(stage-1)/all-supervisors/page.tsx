import { app, metadataTitle } from "@/config/meta";
import { PAGES } from "@/config/pages";

import { SubHeading } from "@/components/heading";
import { PageWrapper } from "@/components/page-wrapper";

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
    <PageWrapper>
      <SubHeading>{PAGES.allSupervisors.title}</SubHeading>
      <SupervisorsDataTable roles={roles} data={data} />
    </PageWrapper>
  );
}
