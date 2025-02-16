import { SubHeading } from "@/components/heading";
import { PanelWrapper } from "@/components/panel-wrapper";

import { api } from "@/lib/trpc/server";
import { InstanceParams } from "@/lib/validations/params";

import { AdjustmentSpace, AllocDetailsProvider } from "./_components";

import { app, metadataTitle } from "@/config/meta";
import { PAGES } from "@/config/pages";

export async function generateMetadata({ params }: { params: InstanceParams }) {
  const { displayName } = await api.institution.instance.get({ params });

  return {
    title: metadataTitle([PAGES.manualChanges.title, displayName, app.name]),
  };
}
export default async function Page({ params }: { params: InstanceParams }) {
  const { students, projects, supervisors } =
    await api.institution.instance.matching.rowData({
      params,
    });

  return (
    <PanelWrapper className="mt-10 flex h-full">
      <SubHeading className="mb-4">{PAGES.manualChanges.title}</SubHeading>
      <AllocDetailsProvider
        students={students}
        projects={projects}
        supervisors={supervisors}
        studentsBackup={structuredClone(students)}
        selectedStudentIds={[]}
      >
        <AdjustmentSpace />
      </AllocDetailsProvider>
    </PanelWrapper>
  );
}
