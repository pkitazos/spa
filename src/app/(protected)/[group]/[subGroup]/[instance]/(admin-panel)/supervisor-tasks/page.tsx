import { app, metadataTitle } from "@/config/meta";
import { PAGES } from "@/config/pages";

import { Heading } from "@/components/heading";
import { JoinInstance } from "@/components/join-instance";
import { SupervisorInstanceHome } from "@/components/pages/supervisor-instance-home";
import { PanelWrapper } from "@/components/panel-wrapper";

import { api } from "@/lib/trpc/server";
import { type InstanceParams } from "@/lib/validations/params";

export async function generateMetadata({ params }: { params: InstanceParams }) {
  const { displayName } = await api.institution.instance.get({ params });

  return {
    title: metadataTitle([
      PAGES.multiRoleSupervisorTasks.title,
      displayName,
      app.name,
    ]),
  };
}

export default async function Page({ params }: { params: InstanceParams }) {
  return (
    <PanelWrapper>
      <Heading>Supervisor Tasks</Heading>
      <SupervisorInstanceHome params={params} />
      <JoinInstance />
    </PanelWrapper>
  );
}
