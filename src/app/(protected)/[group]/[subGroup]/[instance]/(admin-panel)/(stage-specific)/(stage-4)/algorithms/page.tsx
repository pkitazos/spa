import { ListTodoIcon, ListVideoIcon, Trash2Icon } from "lucide-react";

import { app, metadataTitle } from "@/config/meta";
import { PAGES } from "@/config/pages";

import { SectionHeading, Heading } from "@/components/heading";
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
    <PanelWrapper className="gap-16">
      <Heading className="mb-4">{PAGES.algorithms.title}</Heading>
      <AlgorithmProvider selectedAlgName={algorithm?.id}>
        <section className="flex w-full flex-col">
          <SectionHeading icon={ListVideoIcon} className="mb-2">
            Select Algorithms to run
          </SectionHeading>
          <AlgorithmSection takenNames={takenNames} />
        </section>
        <section className="mt-10 flex w-full flex-col">
          <SectionHeading icon={ListTodoIcon} className="mb-2">
            Results Summary
          </SectionHeading>
          <AlgorithmResultDataTable />
        </section>
        <section className="flex w-full flex-col gap-6">
          <SectionHeading
            icon={Trash2Icon}
            iconClassName="text-destructive"
            className="mb-2"
          >
            Danger Zone
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
