import { ReactNode } from "react";

import { Heading } from "@/components/heading";
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
  const access = await api.ac.adminInInstance({ params });
  if (!access) {
    // could potentially throw error as this should be caught by the layout one level up
    return (
      <Unauthorised message="You need to be an admin to access this page" />
    );
  }

  const instance = await api.institution.instance.get({ params });
  const tabGroups = await api.institution.instance.getSidePanelTabs({
    params,
  });

  return (
    <div className="grid w-full grid-cols-11">
      <div className="col-span-2 mt-28 flex justify-center border-r pr-2.5">
        <SidePanel tabGroups={tabGroups} />
      </div>
      <section className="col-span-9 max-w-6xl pb-32">
        {/* <section className="col-span-11 max-w-6xl pb-32"> */}
        <Heading>{instance.displayName}</Heading>
        {children}
      </section>
    </div>
  );
}
