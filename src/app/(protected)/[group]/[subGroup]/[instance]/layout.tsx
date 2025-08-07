import { type ReactNode } from "react";

import { notFound } from "next/navigation";

import { InstanceParamsProvider } from "@/components/params-context";
import { SidebarInset } from "@/components/ui/sidebar";
import { Unauthorised } from "@/components/unauthorised";

import { api } from "@/lib/trpc/server";
import { type InstanceParams } from "@/lib/validations/params";

import { AppSidebar } from "./_components/app-sidebar";

export default async function Layout({
  children,
  params,
}: {
  children: ReactNode;
  params: InstanceParams;
}) {
  // check if this instance exists
  const allocationInstance = await api.institution.instance.exists({ params });
  if (!allocationInstance) notFound();

  // check if this user has access to this instance
  // user might could be a student, supervisor, or admin
  // if they are an admin in this instance, they should have access
  // if they are not an admin in this instance, they should have access if they are a supervisor or student in this instance

  const memberAccess = await api.ac.instanceMembership({ params });
  if (!memberAccess) {
    return (
      <Unauthorised
        title="Unauthorised"
        message="You don't have permission to access this page"
      />
    );
  }

  // if they are a supervisor or student they should only have access depending on the stage of the instance

  const stageAccess = await api.ac.stageAccess({ params });
  if (!stageAccess) {
    return (
      <Unauthorised message="You are not allowed to access the platform at this time" />
    );
  }

  const { displayName, stage } = await api.institution.instance.get({ params });

  const roles = await api.user.roles({ params });

  const tabGroups = await api.institution.instance.getSidePanelTabs({ params });

  return (
    <InstanceParamsProvider instance={{ params, stage, roles }}>
      <div className="flex flex-1">
        <AppSidebar tabGroups={tabGroups} instanceName={displayName} />
        <SidebarInset>
          <div className="absolute flex flex-1 w-full flex-col gap-4 p-4">
            {children}
          </div>
        </SidebarInset>
      </div>
    </InstanceParamsProvider>
  );
}
