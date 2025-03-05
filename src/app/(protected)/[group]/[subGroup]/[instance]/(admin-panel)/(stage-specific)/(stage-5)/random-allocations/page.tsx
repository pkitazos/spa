import { ListIcon } from "lucide-react";

import { SectionHeading, SubHeading } from "@/components/heading";
import { PanelWrapper } from "@/components/panel-wrapper";

import { RandomAllocationsDataTable } from "./_components/random-allocations-data-table";

import { PAGES } from "@/config/pages";

export default async function Page() {
  return (
    <PanelWrapper className="mt-10 flex flex-col items-start gap-16 px-12">
      <SubHeading className="mb-4">{PAGES.randomAllocations.title}</SubHeading>
      <section className="mt-10 flex w-full flex-col">
        <SectionHeading className="mb-2 flex items-center">
          <ListIcon className="mr-2 h-6 w-6 text-indigo-500" />
          <span>All Unmatched Students</span>
        </SectionHeading>
        <RandomAllocationsDataTable />
      </section>
    </PanelWrapper>
  );
}
