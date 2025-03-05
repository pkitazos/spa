import { ReactNode } from "react";

import SidePanel from "@/components/side-panel";
import { Unauthorised } from "@/components/unauthorised";

import { api } from "@/lib/trpc/server";
import { stageLt } from "@/lib/utils/permissions/stage-check";
import { InstanceParams } from "@/lib/validations/params";

import { Role, Stage } from "@/db/types";

export default async function Layout({
  params,
  children,
}: {
  params: InstanceParams;
  children: ReactNode;
}) {
  const roles = await api.user.roles({ params });
  const stage = await api.institution.instance.currentStage({ params });

  if (!roles.has(Role.STUDENT)) {
    return (
      <Unauthorised message="You need to be a Student to access this page" />
    );
  }

  if (stageLt(stage, Stage.STUDENT_BIDDING)) {
    return (
      <Unauthorised message="You are not allowed to access the platform at this time" />
    );
  }

  const tabGroups = await api.institution.instance.getSidePanelTabs({ params });

  return (
    <div className="grid w-full grid-cols-11">
      <div className="col-span-2 mt-28 flex justify-center border-r pr-2.5">
        <SidePanel tabGroups={tabGroups} />
      </div>
      <section className="col-span-9 max-w-6xl pb-32">{children}</section>
    </div>
  );
}
