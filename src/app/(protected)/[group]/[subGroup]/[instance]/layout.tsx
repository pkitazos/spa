import { ReactNode } from "react";
import { notFound } from "next/navigation";

import InstanceSidebar from "@/components/instance-sidebar";
import { InstanceParamsProvider } from "@/components/params-context";
import { DataTableProvider } from "@/components/ui/data-table/data-table-context";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Unauthorised } from "@/components/unauthorised";

import { api } from "@/lib/trpc/server";
import { InstanceParams } from "@/lib/validations/params";

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

  const memberAccess = await api.ac.memberAccess({ params });
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

  const stage = await api.institution.instance.currentStage({ params });
  const roles = await api.user.roles({ params });

  const { flags, tags } = await api.project.details({ params });

  const tabGroups = await api.institution.instance.getSidePanelTabs({
    params,
  });

  return (
    <SidebarProvider>
      <InstanceParamsProvider instance={{ params, stage, roles }}>
        <DataTableProvider details={{ flags, tags }}>
          <InstanceSidebar className="mt-[8dvh]" tabGroups={tabGroups} />
          <header className="sticky top-0 flex h-[5.5rem] w-[5.5rem] flex-1 shrink items-center justify-center gap-2 rounded-md bg-background px-4">
            <SidebarTrigger className="-ml-1" />
          </header>
          {children}
        </DataTableProvider>
      </InstanceParamsProvider>
    </SidebarProvider>
  );
}
