import { Role } from "@prisma/client";
import { notFound } from "next/navigation";

import { AccessControl } from "@/components/access-control";
import { Heading, SubHeading } from "@/components/heading";
import { PageWrapper } from "@/components/page-wrapper";
import { Unauthorised } from "@/components/unauthorised";

import { api } from "@/lib/trpc/server";
import { cn } from "@/lib/utils";
import { InstanceParams } from "@/lib/validations/params";

import { Marking } from "./_components/marking";

import { app, metadataTitle } from "@/content/config/app";
import { pages } from "@/content/pages";

type PageParams = InstanceParams & { id: string };

export async function generateMetadata({ params }: { params: PageParams }) {
  const { displayName } = await api.institution.instance.get({ params });
  const { title } = await api.project.getById({ projectId: params.id });

  return {
    title: metadataTitle([title, pages.myMarking.title, displayName, app.name]),
  };
}

export default async function Marks({ params }: { params: PageParams }) {
  const projectId = params.id;
  const exists = await api.project.exists({
    params,
    projectId: params.id,
  });
  if (!exists) notFound();

  const project = await api.project.getById({ projectId });
  const role = await api.user.role({ params });

  if (role !== Role.SUPERVISOR) {
    return <Unauthorised message={`This is a supervisor only page.`} />;
  }

  const allocatedStudent = await api.project.getAllocation({
    params,
    projectId,
  });

  return (
    <PageWrapper>
      <Heading
        className={cn(
          "flex items-center justify-between gap-2 text-4xl",
          project.title.length > 30 && "text-3xl",
        )}
      >
        <strong>Marking:</strong>
        {project.title}
      </Heading>

      <div className="mt-6 flex flex-col gap-6">
        <Marking
          project={{
            ...project,
            id: projectId,
            marks: project.interimMarkSaved,
          }}
        />
      </div>

      <AccessControl
        allowedRoles={[Role.ADMIN]}
        extraConditions={{ RBAC: { AND: !!allocatedStudent } }}
      >
        <section className={cn("my-16 flex flex-col gap-8")}>
          <SubHeading>Allocation</SubHeading>
        </section>
      </AccessControl>
    </PageWrapper>
  );
}
