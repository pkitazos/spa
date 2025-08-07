import { PAGES } from "@/config/pages";

import { Heading } from "@/components/heading";
import { PanelWrapper } from "@/components/panel-wrapper";

import { api } from "@/lib/trpc/server";
import { type InstanceParams } from "@/lib/validations/params";

import { StageControl } from "./_components/stage-control";

export default async function Page({ params }: { params: InstanceParams }) {
  const stage = await api.institution.instance.currentStage({ params });

  return (
    <PanelWrapper>
      <Heading>{PAGES.stageControl.title}</Heading>
      <StageControl stage={stage} />
    </PanelWrapper>
  );
}
