import { redirect } from "next/navigation";

import { Stage } from "@/db/types";

import { api } from "@/lib/trpc/server";
import { formatParamsAsPath } from "@/lib/utils/general/get-instance-path";
import { stageLt } from "@/lib/utils/permissions/stage-check";
import { type InstanceParams } from "@/lib/validations/params";

export default async function Layout({
  params,
  children,
}: {
  params: InstanceParams;
  children: React.ReactNode;
}) {
  const stage = await api.institution.instance.currentStage({ params });
  const instancePath = formatParamsAsPath(params);

  if (stageLt(stage, Stage.PROJECT_ALLOCATION)) redirect(`${instancePath}/`);

  return <>{children}</>;
}
