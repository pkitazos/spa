import { Heading } from "@/components/heading";
import { JoinInstance } from "@/components/join-instance";
import { SupervisorInstanceHome } from "@/components/pages/supervisor-instance-home";
import { PanelWrapper } from "@/components/panel-wrapper";

import { api } from "@/lib/trpc/server";
import { type InstanceParams } from "@/lib/validations/params";

import Layout from "./layout";

export async function SupervisorOverview({
  params,
}: {
  params: InstanceParams;
}) {
  const { displayName } = await api.institution.instance.get({ params });
  return (
    <Layout params={params}>
      <Heading>{displayName}</Heading>
      <PanelWrapper className="pt-6">
        <SupervisorInstanceHome params={params} />
      </PanelWrapper>
      <JoinInstance />
    </Layout>
  );
}
