import { GraduationCap, Users2Icon } from "lucide-react";

import { SectionHeading, SubHeading } from "@/components/heading";
import { PanelWrapper } from "@/components/panel-wrapper";
import { Card, CardContent, CardDescription } from "@/components/ui/card";

import { api } from "@/lib/trpc/server";
import { InstanceParams } from "@/lib/validations/params";

import { StudentAccessToggle } from "./_components/student-access-toggle";
import { SupervisorAccessToggle } from "./_components/supervisor-access-toggle";

import { app, metadataTitle } from "@/config/meta";
import { PAGES } from "@/config/pages";

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
    <PanelWrapper className="mt-10 flex flex-col items-start gap-10 px-12">
      <SubHeading className="mb-4">{PAGES.manageUserAccess.title}</SubHeading>
      <section className="flex w-full flex-col gap-6">
        <SectionHeading className="mb-2 flex items-center">
          <Users2Icon className="mr-2 h-6 w-6 text-indigo-500" />
          <span>Supervisors access</span>
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
        <SectionHeading className="mb-2 flex items-center">
          <GraduationCap className="mr-2 h-6 w-6 text-indigo-500" />
          <span>Students access</span>
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
