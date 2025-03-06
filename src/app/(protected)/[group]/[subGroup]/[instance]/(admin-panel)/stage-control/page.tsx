import { api } from "@/lib/trpc/server";

import { PanelWrapper } from "@/components/panel-wrapper";
import { StageControl } from "./_components/stage-control";
import { InstanceParams } from "@/lib/validations/params";

export default async function Page({ params }: { params: InstanceParams }) {
  const stage = await api.institution.instance.currentStage({ params });

  return (
    <PanelWrapper>
      <StageControl stage={stage} />
    </PanelWrapper>
  );
}
