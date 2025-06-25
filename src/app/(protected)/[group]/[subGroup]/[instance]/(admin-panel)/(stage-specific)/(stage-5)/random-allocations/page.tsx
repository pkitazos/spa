import { ListIcon } from "lucide-react";

import { SectionHeading, SubHeading } from "@/components/heading";
import { PanelWrapper } from "@/components/panel-wrapper";

import { RandomAllocationsDataTable } from "./_components/random-allocations-data-table";

import { PAGES } from "@/config/pages";
import { InstanceParams } from "@/lib/validations/params";
import { api } from "@/lib/trpc/server";

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
    <PanelWrapper className="mt-10 flex flex-col items-start gap-16 px-12">
      <SubHeading className="mb-4">{PAGES.randomAllocations.title}</SubHeading>
      <section className="mt-10 flex w-full flex-col">
        <SectionHeading className="mb-2 flex items-center">
          <ListIcon className="mr-2 h-6 w-6 text-indigo-500" />
          <span>All Unmatched Students</span>
        </SectionHeading>
        <RandomAllocationsDataTable studentData={allStudentData} />
      </section>
    </PanelWrapper>
  );
}
