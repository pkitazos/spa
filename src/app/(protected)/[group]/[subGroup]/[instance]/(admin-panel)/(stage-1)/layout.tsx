import { Stage } from "@prisma/client";
import { redirect } from "next/navigation";

import { api } from "@/lib/trpc/server";
import { formatParamsAsPath } from "@/lib/utils/general/get-instance-path";
import { stageGt } from "@/lib/utils/permissions/stage-check";
import { InstanceParams } from "@/lib/validations/params";

export default async function Layout({
  params,
  children,
}: {
  params: InstanceParams;
  children: React.ReactNode;
}) {
  const stage = await api.institution.instance.currentStage({ params });
  const instancePath = formatParamsAsPath(params);

  if (stageGt(stage, Stage.STUDENT_BIDDING)) redirect(`${instancePath}/`);

  return <>{children}</>;
}
