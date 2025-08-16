import { GraduationCap, Users2Icon } from "lucide-react";

import { app, metadataTitle } from "@/config/meta";
import { PAGES } from "@/config/pages";

import { SectionHeading, Heading } from "@/components/heading";
import { PanelWrapper } from "@/components/panel-wrapper";
import { Card, CardContent, CardDescription } from "@/components/ui/card";

import { api } from "@/lib/trpc/server";
import { type InstanceParams } from "@/lib/validations/params";

import { StudentAccessToggle } from "./_components/student-access-toggle";
import { SupervisorAccessToggle } from "./_components/supervisor-access-toggle";

export async function generateMetadata({ params }: { params: InstanceParams }) {
  const { displayName } = await api.institution.instance.get({ params });

  return {
    title: metadataTitle([PAGES.manageUserAccess.title, displayName, app.name]),
  };
}

export default async function Page({ params }: { params: InstanceParams }) {
  const supervisor = await api.user.supervisor.allocationAccess({ params });
  const student = await api.user.student.allocationAccess({ params });

  return (
    <PanelWrapper className="gap-10">
      <Heading className="mb-4">{PAGES.manageUserAccess.title}</Heading>
      <section className="flex w-full flex-col gap-6">
        <SectionHeading icon={Users2Icon} className="mb-2">
          Supervisors access
        </SectionHeading>
        <Card className="w-full">
          <CardContent className="flex items-center justify-between gap-5 pt-6">
            <CardDescription className="text-base text-muted-foreground">
              Toggle the supervisor access for this instance. When enabled,
              supervisors will have be able to view their allocations.
            </CardDescription>
            <SupervisorAccessToggle supervisor={supervisor} />
          </CardContent>
        </Card>
      </section>
      <section className="flex w-full flex-col gap-6">
        <SectionHeading icon={GraduationCap} className="mb-2">
          Students access
        </SectionHeading>
        <Card className="w-full">
          <CardContent className="flex items-center justify-between gap-5 pt-6">
            <CardDescription className="text-base text-muted-foreground">
              Toggle the student access for this instance. When enabled,
              students will have be able to view their allocations
            </CardDescription>
            <StudentAccessToggle student={student} />
          </CardContent>
        </Card>
      </section>
    </PanelWrapper>
  );
}
