import { ReactNode } from "react";
import { Role } from "@prisma/client";

import SidePanel from "@/components/side-panel";
import { Unauthorised } from "@/components/unauthorised";

import { api } from "@/lib/trpc/server";
import { InstanceParams } from "@/lib/validations/params";

export default async function Layout({
  params,
  children,
}: {
  params: InstanceParams;
  children: ReactNode;
}) {
  const roles = await api.user.roles({ params });

  //   if (!roles.has(Role.SUPERVISOR) || !roles.has(Role.READER)) {
  if (!roles.has(Role.SUPERVISOR)) {
    return (
      <Unauthorised message="You need to be a Supervisor to access this page" />
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
