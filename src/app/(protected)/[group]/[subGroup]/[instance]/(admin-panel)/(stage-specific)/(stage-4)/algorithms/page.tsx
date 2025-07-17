import { ListTodoIcon, ListVideoIcon, Trash2Icon } from "lucide-react";

import { app, metadataTitle } from "@/config/meta";
import { PAGES } from "@/config/pages";

import { SectionHeading, SubHeading } from "@/components/heading";
import { PanelWrapper } from "@/components/panel-wrapper";

import { api } from "@/lib/trpc/server";
import { type InstanceParams } from "@/lib/validations/params";

import { AlgorithmProvider } from "./_components/algorithm-context";
import { AlgorithmSection } from "./_components/algorithm-data-table";
import { AlgorithmResultDataTable } from "./_components/algorithm-result-data-table";
import { ClearResultsSection } from "./_components/clear-results-section";

export async function generateMetadata({ params }: { params: InstanceParams }) {
  const { displayName } = await api.institution.instance.get({ params });

  return {
    title: metadataTitle([PAGES.algorithms.title, displayName, app.name]),
  };
}

export default async function Page({ params }: { params: InstanceParams }) {
  const algorithm = await api.institution.instance.selectedAlgorithm({
    params,
  });

  const takenNames = await api.institution.instance.algorithm.takenNames({
    params,
  });

  return (
    <PanelWrapper className="mt-10 flex flex-col items-start gap-16 px-12">
      <SubHeading className="mb-4">{PAGES.algorithms.title}</SubHeading>
      <AlgorithmProvider selectedAlgName={algorithm?.id}>
        <section className="flex w-full flex-col">
          <SectionHeading className="mb-2 flex items-center">
            <ListVideoIcon className="mr-2 h-6 w-6 text-indigo-500" />
            <span>Select Algorithms to run</span>
          </SectionHeading>
          <AlgorithmSection takenNames={takenNames} />
        </section>
        <section className="mt-10 flex w-full flex-col">
          <SectionHeading className="mb-2 flex items-center">
            <ListTodoIcon className="mr-2 h-6 w-6 text-indigo-500" />
            <span>Results Summary</span>
          </SectionHeading>
          <AlgorithmResultDataTable />
        </section>
        <section className="flex w-full flex-col gap-6">
          <SectionHeading className="mb-2 flex items-center">
            <Trash2Icon className="mr-2 h-6 w-6 text-destructive" />
            <span>Danger Zone</span>
          </SectionHeading>
          {/* // TODO: should be disabled if the algorithm displayName is undefined  */}
          <ClearResultsSection
            algorithmDisplayName={algorithm?.displayName ?? ""}
          />
        </section>
      </AlgorithmProvider>
    </PanelWrapper>
  );
}
