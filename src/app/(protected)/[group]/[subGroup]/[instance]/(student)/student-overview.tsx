import { type ReactNode } from "react";

import { format } from "date-fns";
import { Clock10Icon, ListCheckIcon, ListTodoIcon } from "lucide-react";
import Link from "next/link";

import { PAGES } from "@/config/pages";

import { Stage } from "@/db/types";

import { Heading, SectionHeading } from "@/components/heading";
import { InstanceLink } from "@/components/instance-link";
import { JoinInstance } from "@/components/join-instance";
import { PanelWrapper } from "@/components/panel-wrapper";
import { buttonVariants } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Unauthorised } from "@/components/unauthorised";

import { api } from "@/lib/trpc/server";
import { cn } from "@/lib/utils";
import { formatParamsAsPath } from "@/lib/utils/general/get-instance-path";
import { type InstanceParams } from "@/lib/validations/params";

import Layout from "./layout";

export async function StudentOverview({ params }: { params: InstanceParams }) {
  const stage = await api.institution.instance.currentStage({ params });

  const { displayName, preferenceSubmissionDeadline: deadline } =
    await api.user.student.overviewData({ params });

  const { minPreferences, maxPreferences } =
    await api.user.student.preferenceRestrictions({ params });

  if (stage === Stage.STUDENT_BIDDING) {
    const preAllocatedProject = await api.user.student.isPreAllocated({
      params,
    });

    const instancePath = formatParamsAsPath(params);

    if (preAllocatedProject) {
      const { project } = await api.user.student.getPreAllocation({ params });

      return (
        <ThinLayout pageName={displayName} params={params}>
          <div className="mt-9 flex justify-between">
            <div className="flex flex-col justify-start">
              <div className="flex flex-col gap-4">
                <SectionHeading icon={ListTodoIcon} className="mb-2">
                  Task List
                </SectionHeading>
                <p>
                  You are allocated to your self-defined project and do not need
                  to submit preferences.
                </p>
                <p className="flex items-center justify-start gap-2">
                  View your project:
                  <Link
                    href={`${instancePath}/projects/${project.id}`}
                    className={cn(
                      buttonVariants({ variant: "link" }),
                      "text-base",
                    )}
                  >
                    {project.title}
                  </Link>
                </p>
              </div>
            </div>
            <Calendar
              className="rounded-md border"
              mode="single"
              selected={deadline}
              defaultMonth={deadline}
            />
          </div>
        </ThinLayout>
      );
    }

    return (
      <ThinLayout pageName={displayName} params={params}>
        <div className="mt-9 flex justify-between">
          <div className="flex flex-col justify-start">
            <div className="flex flex-col gap-4">
              <SectionHeading icon={Clock10Icon} className="mb-2">
                Preference List Submission Deadline
              </SectionHeading>
              <p className="flex gap-2 text-xl">
                {format(deadline, "dd MMM yyyy - HH:mm")}
                <span className="text-muted-foreground">
                  {format(deadline, "OOOO")}
                </span>
              </p>
            </div>
            <div className="mt-16 flex flex-col gap-4">
              <SectionHeading className="mb-2 flex items-center">
                <ListTodoIcon className="mr-2 h-6 w-6 text-indigo-500" />
                <span>Task List</span>
              </SectionHeading>
              <ul className="ml-6 list-disc [&>li]:mt-2">
                <li>
                  Submit your preference list{" "}
                  <span className="text-muted-foreground">
                    (between {minPreferences} and {maxPreferences} inclusive)
                  </span>
                </li>
              </ul>
            </div>
          </div>
          <Calendar
            className="rounded-md border"
            mode="single"
            selected={deadline}
            defaultMonth={deadline}
          />
        </div>
      </ThinLayout>
    );
  }

  const allocationAccess = await api.user.student.allocationAccess({ params });

  if (
    stage === Stage.ALLOCATION_ADJUSTMENT ||
    stage === Stage.PROJECT_ALLOCATION ||
    (stage === Stage.ALLOCATION_PUBLICATION && !allocationAccess)
  ) {
    return (
      <ThinLayout pageName={displayName} params={params}>
        <div className="mt-9 flex flex-col gap-4">
          <SectionHeading icon={ListTodoIcon} className="mb-2">
            Task List
          </SectionHeading>
          <p>Nothing to do at this stage</p>
        </div>
      </ThinLayout>
    );
  }

  if (stage === Stage.ALLOCATION_PUBLICATION && allocationAccess) {
    return (
      <ThinLayout pageName={displayName} params={params}>
        <div className="mt-9 flex flex-col gap-4">
          <SectionHeading icon={ListCheckIcon} className="mb-2">
            Allocations Released
          </SectionHeading>

          <p className="text-lg">
            Check the{" "}
            <InstanceLink href={PAGES.myAllocation.href}>
              {PAGES.myAllocation.title}
            </InstanceLink>{" "}
            page to view your allocated project
          </p>
        </div>
      </ThinLayout>
    );
  }

  return (
    <Unauthorised message="You are not allowed to access the platform at this time" />
  );
}

function ThinLayout({
  params,
  pageName,
  children,
}: {
  params: InstanceParams;
  pageName: string;
  children: ReactNode;
}) {
  return (
    <Layout params={params}>
      <Heading>{pageName}</Heading>
      <PanelWrapper className="pt-6">{children}</PanelWrapper>
      <JoinInstance />
    </Layout>
  );
}
