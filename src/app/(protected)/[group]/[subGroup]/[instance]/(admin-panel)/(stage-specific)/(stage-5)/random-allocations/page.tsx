import { ListIcon } from "lucide-react";

import { app, metadataTitle } from "@/config/meta";
import { PAGES } from "@/config/pages";

import { SectionHeading, Heading } from "@/components/heading";
import { PanelWrapper } from "@/components/panel-wrapper";

import { api } from "@/lib/trpc/server";
import { type InstanceParams } from "@/lib/validations/params";

import { RandomAllocationsDataTable } from "./_components/random-allocations-data-table";

export async function generateMetadata({ params }: { params: InstanceParams }) {
  const { displayName } = await api.institution.instance.get({ params });

  return {
    title: metadataTitle([
      PAGES.randomAllocations.title,
      displayName,
      app.name,
    ]),
  };
}

export default async function Page({ params }: { params: InstanceParams }) {
  const unallocatedStudents =
    await api.institution.instance.getUnallocatedStudents({ params });

  const randomlyAllocatedStudentData =
    await api.institution.instance.getRandomlyAllocatedStudents({ params });

  const unallocatedStudentData = unallocatedStudents.map((student) => ({
    student,
    project: undefined,
  }));

  const allStudentData = [
    ...randomlyAllocatedStudentData,
    ...unallocatedStudentData,
  ];

  return (
    <PanelWrapper className="gap-10">
      <Heading className="mb-4">{PAGES.randomAllocations.title}</Heading>
      <section className="flex w-full flex-col">
        <SectionHeading icon={ListIcon} className="mb-2">
          All Unmatched Students
        </SectionHeading>
        <RandomAllocationsDataTable studentData={allStudentData} />
      </section>
    </PanelWrapper>
  );
}
