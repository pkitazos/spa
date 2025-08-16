import { FolderXIcon } from "lucide-react";

import { app, metadataTitle } from "@/config/meta";
import { PAGES } from "@/config/pages";

import { Heading, SectionHeading } from "@/components/heading";
import { PanelWrapper } from "@/components/panel-wrapper";
import { Unauthorised } from "@/components/unauthorised";

import { api } from "@/lib/trpc/server";
import { type InstanceParams } from "@/lib/validations/params";

import { AllocationCard } from "./_components/allocation-card";

export async function generateMetadata({ params }: { params: InstanceParams }) {
  const { displayName } = await api.institution.instance.get({ params });

  return {
    title: metadataTitle([PAGES.mySupervisions.title, displayName, app.name]),
  };
}

export default async function Page({ params }: { params: InstanceParams }) {
  const allocationAccess = await api.user.supervisor.allocationAccess({
    params,
  });

  if (!allocationAccess) {
    return (
      <Unauthorised message="You are not allowed to access this resource at this time" />
    );
  }

  // pin: output type is not standard
  const allocations = await api.user.supervisor.allocations({ params });

  return (
    <PanelWrapper className="gap-10">
      <Heading>{PAGES.mySupervisions.title}</Heading>
      {allocations.length === 0 ? (
        <div className="mt-9 flex flex-col gap-4">
          <SectionHeading icon={FolderXIcon}>Allocations</SectionHeading>
          <p>You have not been allocated any students</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {allocations.map(({ project, student, rank }, i) => (
            <AllocationCard
              key={i}
              project={project}
              student={student}
              allocationRank={rank}
            />
          ))}
        </div>
      )}
    </PanelWrapper>
  );
}
