import { User2Icon } from "lucide-react";
import { notFound } from "next/navigation";

import { app, metadataTitle } from "@/config/meta";
import { PAGES } from "@/config/pages";

import { Heading, SectionHeading } from "@/components/heading";
import { PanelWrapper } from "@/components/panel-wrapper";

import { api } from "@/lib/trpc/server";
import { type InstanceParams } from "@/lib/validations/params";

import { StudentAllocation } from "./_components/student-allocation";
import { StudentDetailsCard } from "./_components/student-details-card";
import { StudentPreferencesSection } from "./_components/student-preferences-section";
import { StudentProjectSection } from "./_components/student-project-section";

type PageParams = InstanceParams & { id: string };

export async function generateMetadata({ params }: { params: PageParams }) {
  const { displayName } = await api.institution.instance.get({ params });
  const { name } = await api.user.getById({ userId: params.id });

  return {
    title: metadataTitle([
      name,
      PAGES.allStudents.title,
      displayName,
      app.name,
    ]),
  };
}

export default async function Page({ params }: { params: PageParams }) {
  const studentId = params.id;
  const exists = await api.user.student.exists({ params, studentId });
  if (!exists) notFound();

  const flags = await api.institution.instance.getFlags({ params });

  const { student, selfDefinedProjectId, allocation } =
    await api.user.student.getById({ params, studentId });

  return (
    <PanelWrapper>
      <Heading>{student.name}</Heading>

      <SectionHeading icon={User2Icon} className="mt-6 mb-2">
        Details
      </SectionHeading>
      <section className="flex gap-10">
        <StudentDetailsCard className="w-1/2" student={student} flags={flags} />
        {/* If the student has been allocated a project show it */}
        {allocation && (
          <StudentAllocation
            className="w-1/2"
            allocation={allocation}
            selfDefined={!!selfDefinedProjectId}
          />
        )}
      </section>

      {/* if the student has already been allocated a project show it */}
      {allocation && (
        <StudentProjectSection
          className="mt-16"
          allocatedProject={allocation.project}
        />
      )}

      {/* if the student has not defined a project show their preferences */}
      {!selfDefinedProjectId && <StudentPreferencesSection params={params} />}
    </PanelWrapper>
  );
}
