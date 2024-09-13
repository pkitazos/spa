import { DatabaseIcon } from "lucide-react";

import { SectionHeading, SubHeading } from "@/components/heading";
import { PanelWrapper } from "@/components/panel-wrapper";

import { api } from "@/lib/trpc/server";
import { InstanceParams } from "@/lib/validations/params";

import { PreAllocatedProjectDataTable } from "./_components/pre-allocated-project-data-table";

import { pages } from "@/content/pages";

export default async function Page({ params }: { params: InstanceParams }) {
  const projects = await api.project.getAllPreAllocated({ params });

  return (
    <PanelWrapper className="mt-10 flex flex-col items-start gap-16 px-12">
      <SubHeading className="mb-4">
        {pages.preAllocatedProjects.title}
      </SubHeading>
      <section className="flex w-full flex-col gap-5">
        <SectionHeading className="flex items-center">
          <DatabaseIcon className="mr-2 h-6 w-6 text-indigo-500" />
          <span>All data</span>
        </SectionHeading>
        <PreAllocatedProjectDataTable data={projects} />
      </section>
    </PanelWrapper>
  );
}
