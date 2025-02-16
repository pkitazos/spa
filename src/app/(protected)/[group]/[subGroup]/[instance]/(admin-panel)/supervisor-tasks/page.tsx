import { JoinInstance } from "@/components/join-instance";
import { SupervisorInstanceHome } from "@/components/pages/supervisor-instance-home";
import { PanelWrapper } from "@/components/panel-wrapper";

import { api } from "@/lib/trpc/server";
import { InstanceParams } from "@/lib/validations/params";

import { app, metadataTitle } from "@/config/meta";
import { PAGES } from "@/config/pages";

export async function generateMetadata({ params }: { params: InstanceParams }) {
  const { displayName } = await api.institution.instance.get({ params });

  return {
    title: metadataTitle([PAGES.supervisorTasks.title, displayName, app.name]),
  };
}

export default async function Page({ params }: { params: InstanceParams }) {
  return (
    <PanelWrapper>
      <SupervisorInstanceHome params={params} />
      <JoinInstance />
    </PanelWrapper>
  );
}
