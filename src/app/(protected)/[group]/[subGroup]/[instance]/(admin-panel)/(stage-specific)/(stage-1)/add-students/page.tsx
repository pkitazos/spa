import { app, metadataTitle } from "@/config/meta";
import { PAGES } from "@/config/pages";

import { SubHeading } from "@/components/heading";
import { PanelWrapper } from "@/components/panel-wrapper";

import { api } from "@/lib/trpc/server";
import { type InstanceParams } from "@/lib/validations/params";

import { AddStudentsSection } from "./_components/add-students-section";

export async function generateMetadata({ params }: { params: InstanceParams }) {
  const { displayName } = await api.institution.instance.get({ params });

  return {
    title: metadataTitle([PAGES.addStudents.title, displayName, app.name]),
  };
}

export default function Page() {
  return (
    <PanelWrapper className="mt-10">
      <SubHeading className="mb-4">{PAGES.addStudents.title}</SubHeading>
      <AddStudentsSection />
    </PanelWrapper>
  );
}
