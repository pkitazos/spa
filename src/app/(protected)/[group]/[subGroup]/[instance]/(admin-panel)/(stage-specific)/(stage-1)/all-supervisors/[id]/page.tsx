import { FilePlus2Icon } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Heading, SubHeading } from "@/components/heading";
import { PageWrapper } from "@/components/page-wrapper";
import { buttonVariants } from "@/components/ui/button";
import { UserDetailsCard } from "@/components/user-details-card";

import { api } from "@/lib/trpc/server";
import { cn } from "@/lib/utils";
import { PageParams } from "@/lib/validations/params";

import { InstanceDetailsCard } from "./_components/instance-details-card";
import { SupervisorProjectsDataTable } from "./_components/supervisor-projects-data-table";

import { app, metadataTitle } from "@/config/meta";
import { PAGES } from "@/config/pages";

export async function generateMetadata({ params }: { params: PageParams }) {
  const { displayName } = await api.institution.instance.get({ params });
  const { name } = await api.user.getById({ userId: params.id });

  return {
    title: metadataTitle([
      name,
      PAGES.allSupervisors.title,
      displayName,
      app.name,
    ]),
  };
}

export default async function Page({ params }: { params: PageParams }) {
  const supervisorId = params.id;
  const exists = await api.user.supervisor.exists({
    params,
    supervisorId,
  });
  if (!exists) notFound();

  const { supervisor, projects } = await api.user.supervisor.instanceData({
    params,
    supervisorId,
  });

  return (
    <PageWrapper>
      <Heading
        className={cn(
          "flex items-center justify-between gap-2",
          supervisor.name.length > 30 && "text-3xl",
        )}
      >
        <p>{supervisor.name}</p>
      </Heading>
      <div className="flex min-h-44 items-start justify-between gap-5">
        <UserDetailsCard user={supervisor} />
        <InstanceDetailsCard supervisor={supervisor} />
      </div>
      <div className="-mb-2 mt-6 flex items-center justify-between">
        <SubHeading>All Projects</SubHeading>
        <Link
          className={cn(
            buttonVariants({ variant: "secondary" }),
            "flex items-center justify-center gap-2 text-nowrap",
          )}
          href={`../supervisors/${supervisorId}/new-project`}
        >
          <FilePlus2Icon className="h-4 w-4" />
          <p>New Project</p>
        </Link>
      </div>
      <SupervisorProjectsDataTable data={projects} />
    </PageWrapper>
  );
}
