import { app, metadataTitle } from "@/config/meta";
import { PAGES } from "@/config/pages";

import { Heading } from "@/components/heading";
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
    <PanelWrapper>
      <Heading>{PAGES.addStudents.title}</Heading>
      <AddStudentsSection />
    </PanelWrapper>
  );
}
