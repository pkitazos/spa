import { format } from "date-fns";
import { Clock10Icon, ListTodoIcon, ListCheckIcon } from "lucide-react";

import { PAGES } from "@/config/pages";

import { Stage } from "@/db/types";

import { SectionHeading } from "@/components/heading";
import { Calendar } from "@/components/ui/calendar";
import { Unauthorised } from "@/components/unauthorised";

import { api } from "@/lib/trpc/server";
import { stageGte } from "@/lib/utils/permissions/stage-check";
import { type InstanceParams } from "@/lib/validations/params";

import { InstanceLink } from "../instance-link";

export async function SupervisorInstanceHome({
  params,
}: {
  params: InstanceParams;
}) {
  const stage = await api.institution.instance.currentStage({ params });

  const { projectSubmissionDeadline: deadline } =
    await api.user.supervisor.instancePage({ params });

  const { currentSubmissionCount, submissionTarget } =
    await api.user.supervisor.projectStats({ params });

  if (stage === Stage.PROJECT_SUBMISSION) {
    return (
      <div className="mt-9 flex justify-between">
        <div className="flex flex-col justify-start">
          <div className="flex flex-col gap-4">
            <SectionHeading icon={Clock10Icon} className="mb-2">
              Project Upload Deadline
            </SectionHeading>
            <p className="flex gap-2 text-xl">
              {format(deadline, "dd MMM yyyy - HH:mm")}
              <span className="text-muted-foreground">
                {format(deadline, "OOOO")}
              </span>
            </p>
          </div>
          <div className="mt-16 flex flex-col gap-4">
            <SectionHeading icon={ListTodoIcon} className="mb-2">
              Task List
            </SectionHeading>
            <ul className="ml-6 list-disc [&>li]:mt-2">
              {submissionTarget > 0 && (
                <li>
                  Submit {submissionTarget} projects{" "}
                  <span className="text-muted-foreground">
                    (currently submitted: {currentSubmissionCount})
                  </span>
                </li>
              )}
              <li>Submit any self-defined projects</li>
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
    );
  }

  const allocationAccess = await api.user.supervisor.allocationAccess({
    params,
  });

  if (
    stage === Stage.STUDENT_BIDDING ||
    stage === Stage.PROJECT_ALLOCATION ||
    stage === Stage.ALLOCATION_ADJUSTMENT ||
    (stage === Stage.ALLOCATION_PUBLICATION && !allocationAccess)
  ) {
    return (
      <div className="mt-9 flex flex-col gap-4">
        <SectionHeading icon={ListTodoIcon} className="mb-2">
          Task List
        </SectionHeading>
        <p>Nothing to do at this stage</p>
      </div>
    );
  }

  if (stage === Stage.ALLOCATION_PUBLICATION && allocationAccess) {
    return (
      <div className="mt-9 flex flex-col gap-4">
        <SectionHeading icon={ListCheckIcon} className="mb-2">
          Allocations Released
        </SectionHeading>
        <p className="text-lg">
          Check the{" "}
          <InstanceLink href={PAGES.mySupervisions.href}>
            {PAGES.mySupervisions.title}
          </InstanceLink>{" "}
          page to view your allocated projects
        </p>
      </div>
    );
  }

  if (stageGte(stage, Stage.READER_BIDDING)) {
    return (
      <div className="mt-9 flex flex-col gap-4">
        <SectionHeading icon={ListCheckIcon} className="mb-2 flex items-center">
          Marking Allocations Released
        </SectionHeading>
        <p className="text-lg">
          Check the{" "}
          <InstanceLink href={PAGES.myMarking.href}>
            {PAGES.myMarking.title}
          </InstanceLink>{" "}
          page to view the projects you have to mark
        </p>
      </div>
    );
  }

  return (
    <Unauthorised message="You are not allowed to access the platform at this time" />
  );
}
