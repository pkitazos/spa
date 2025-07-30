import { AwardIcon, MailIcon, User2Icon } from "lucide-react";

import { app, metadataTitle } from "@/config/meta";
import { PAGES } from "@/config/pages";

import { CopyEmailLink } from "@/components/copy-email-link";
import { Heading, SectionHeading, SubHeading } from "@/components/heading";
import { MarkdownRenderer } from "@/components/markdown-editor";
import { PanelWrapper } from "@/components/panel-wrapper";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Unauthorised } from "@/components/unauthorised";

import { auth } from "@/lib/auth";
import { api } from "@/lib/trpc/server";
import { toPositional } from "@/lib/utils/general/to-positional";
import { type InstanceParams } from "@/lib/validations/params";

export async function generateMetadata({ params }: { params: InstanceParams }) {
  const { displayName } = await api.institution.instance.get({ params });

  return {
    title: metadataTitle([PAGES.myAllocation.title, displayName, app.name]),
  };
}

export default async function Page({ params }: { params: InstanceParams }) {
  const allocationAccess = await api.user.student.allocationAccess({ params });

  if (!allocationAccess) {
    return (
      <Unauthorised message="You are not allowed to access this resource at this time" />
    );
  }

  const { mask: user } = await auth();

  const allocatedProject = await api.user.student.getAllocatedProject({
    params,
    studentId: user.id,
  });

  return (
    <PanelWrapper className="gap-10">
      <Heading>{PAGES.myAllocation.title}</Heading>
      {!allocatedProject ? (
        <div className="mt-9 flex flex-col gap-4">
          <SubHeading>Allocation</SubHeading>
          <p>You have not been allocated a project</p>
        </div>
      ) : (
        <div className="mt-16 flex flex-col gap-8">
          <Card className="mb-8">
            <CardContent className="pt-6">
              <SectionHeading className="flex items-center text-2xl no-underline">
                <AwardIcon className="mr-2 h-6 w-6 text-indigo-500" />
                <span>
                  You got your{" "}
                  <span className="font-semibold text-indigo-600">
                    {toPositional(allocatedProject.studentRanking)}
                  </span>{" "}
                  choice
                </span>
              </SectionHeading>
            </CardContent>
          </Card>
          <SectionHeading>{allocatedProject.title}</SectionHeading>
          <div className="flex flex-col items-start">
            <div className="flex items-center gap-2 text-lg">
              <div className="text-muted-foreground">
                <User2Icon className="h-6 w-6" />
              </div>
              <p className="text-xl font-medium">
                {allocatedProject.supervisor.name}
              </p>
            </div>
            <div className="flex items-center gap-2 text-lg">
              <div className="text-muted-foreground">
                <MailIcon className="h-6 w-6" />
              </div>
              <CopyEmailLink
                className="text-base font-medium"
                email={allocatedProject.supervisor.email}
              />
            </div>
            <Separator className="my-6" />
            <MarkdownRenderer source={allocatedProject.description} />
          </div>
        </div>
      )}
    </PanelWrapper>
  );
}
