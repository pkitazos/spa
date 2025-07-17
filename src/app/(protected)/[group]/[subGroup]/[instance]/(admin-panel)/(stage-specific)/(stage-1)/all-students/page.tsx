import { app, metadataTitle } from "@/config/meta";
import { PAGES } from "@/config/pages";

import { SubHeading } from "@/components/heading";
import { PageWrapper } from "@/components/page-wrapper";

import { api } from "@/lib/trpc/server";
import { type InstanceParams } from "@/lib/validations/params";

import { StudentsDataTable } from "./_components/all-students-data-table";

export async function generateMetadata({ params }: { params: InstanceParams }) {
  const { displayName } = await api.institution.instance.get({ params });

  return {
    title: metadataTitle([PAGES.allStudents.title, displayName, app.name]),
  };
}

export default async function Students({ params }: { params: InstanceParams }) {
  const roles = await api.user.roles({ params });
  const tableData = await api.institution.instance.students({ params });

  return (
    <PageWrapper>
      <SubHeading>{PAGES.allStudents.title}</SubHeading>
      <StudentsDataTable roles={roles} data={tableData} />
    </PageWrapper>
  );
}
