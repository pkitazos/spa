import { DatabaseIcon, ZapIcon } from "lucide-react";

import { app, metadataTitle } from "@/config/meta";
import { PAGES } from "@/config/pages";

import { CopyEmailsButton } from "@/components/copy-emails-button";
import { Heading, SectionHeading } from "@/components/heading";
import { PanelWrapper } from "@/components/panel-wrapper";
import { Card, CardContent } from "@/components/ui/card";

import { api } from "@/lib/trpc/server";
import { type InstanceParams } from "@/lib/validations/params";

import { ProjectSubmissionsDataTable } from "./_components/project-submissions-data-table";

export async function generateMetadata({ params }: { params: InstanceParams }) {
  const { displayName } = await api.institution.instance.get({ params });

  return {
    title: metadataTitle([
      PAGES.projectSubmissions.title,
      displayName,
      app.name,
    ]),
  };
}

export default async function Page({ params }: { params: InstanceParams }) {
  const submissionData = await api.project.supervisorSubmissionInfo({ params });

  const incomplete = submissionData
    .filter((s) => !s.targetMet)
    .map((s) => s.supervisor);

  return (
    <PanelWrapper className="gap-16">
      <Heading className="mb-4">{PAGES.projectSubmissions.title}</Heading>
      <section className="flex flex-col gap-5">
        <SectionHeading icon={ZapIcon}>Quick Actions</SectionHeading>
        <Card className="w-full">
          <CardContent className="mt-6 flex items-center justify-between gap-10">
            {incomplete.length !== 0 ? (
              <>
                <p>
                  <span className="font-semibold">{incomplete.length}</span> out
                  of{" "}
                  <span className="font-semibold">{submissionData.length}</span>{" "}
                  supervisors have not met their submission target
                </p>
                <CopyEmailsButton data={incomplete} />
              </>
            ) : (
              <p>All supervisors have met their submission target</p>
            )}
          </CardContent>
        </Card>
      </section>
      <section className="flex w-full flex-col gap-5">
        <SectionHeading icon={DatabaseIcon}>All data</SectionHeading>
        <ProjectSubmissionsDataTable data={submissionData} />
      </section>
    </PanelWrapper>
  );
}
