import { ReactNode } from "react";
import { format } from "date-fns";
import Link from "next/link";

import { Heading, SubHeading } from "@/components/heading";
import { JoinInstance } from "@/components/join-instance";
import { PanelWrapper } from "@/components/panel-wrapper";
import { buttonVariants } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Unauthorised } from "@/components/unauthorised";

import { api } from "@/lib/trpc/server";
import { cn } from "@/lib/utils";
import { formatParamsAsPath } from "@/lib/utils/general/get-instance-path";
import { InstanceParams } from "@/lib/validations/params";

import Layout from "./layout";

import { Stage } from "@/db/types";

export async function StudentOverview({ params }: { params: InstanceParams }) {
  const stage = await api.institution.instance.currentStage({ params });

  const {
    displayName,
    preferenceSubmissionDeadline: deadline,
    deadlineTimeZoneOffset: timeZoneOffset,
  } = await api.user.student.overviewData({ params });

  const { minPreferences, maxPreferences } =
    await api.user.student.preferenceRestrictions({ params });

  if (stage === Stage.STUDENT_BIDDING) {
    const preAllocatedProject = await api.user.student.isPreAllocated({
      params,
    });
    const instancePath = formatParamsAsPath(params);
    if (preAllocatedProject) {
      return (
        <ThinLayout pageName={displayName} params={params}>
          <div className="mt-9 flex justify-between">
            <div className="flex flex-col justify-start">
              <div className="flex flex-col gap-4">
                <SubHeading>Task List</SubHeading>
                <p>
                  You are allocated to your self-defined project and do not need
                  to submit preferences.
                </p>
                <p className="flex items-center justify-start gap-2">
                  View your project:
                  <Link
                    href={`${instancePath}/projects/${preAllocatedProject.id}`}
                    className={cn(
                      buttonVariants({ variant: "link" }),
                      "text-base",
                    )}
                  >
                    {preAllocatedProject.title}
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
              <SubHeading>Preference List Submission Deadline</SubHeading>
              <p className="flex gap-2 text-xl">
                {format(deadline, "dd MMM yyyy - HH:mm")}
                <span className="text-muted-foreground">{timeZoneOffset}</span>
              </p>
            </div>
            <div className="mt-16 flex flex-col gap-4">
              <SubHeading>Task List</SubHeading>
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
          <SubHeading>Task List</SubHeading>
          <p>Nothing to do at this stage</p>
        </div>
      </ThinLayout>
    );
  }

  if (stage === Stage.ALLOCATION_PUBLICATION && allocationAccess) {
    return (
      <ThinLayout pageName={displayName} params={params}>
        <div className="mt-9 flex flex-col gap-4">
          <SubHeading>Allocations Released</SubHeading>
          <p className="text-lg">
            Check the &ldquo;My Allocation&rdquo; page to view your allocated
            projects
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
