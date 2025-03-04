import { Stage } from "@prisma/client";
import { format } from "date-fns";

import { SubHeading } from "@/components/heading";
import { Calendar } from "@/components/ui/calendar";
import { Unauthorised } from "@/components/unauthorised";

import { api } from "@/lib/trpc/server";
import { InstanceParams } from "@/lib/validations/params";

export async function SupervisorInstanceHome({
  params,
}: {
  params: InstanceParams;
}) {
  const stage = await api.institution.instance.currentStage({ params });

  const {
    projectSubmissionDeadline: deadline,
    deadlineTimeZoneOffset: timeZoneOffset,
  } = await api.user.supervisor.instancePage({ params });

  const { currentSubmissionCount, submissionTarget } =
    await api.user.supervisor.projectStats({ params });

  if (stage === Stage.PROJECT_SUBMISSION) {
    return (
      <div className="mt-9 flex justify-between">
        <div className="flex flex-col justify-start">
          <div className="flex flex-col gap-4">
            <SubHeading>Project Upload Deadline</SubHeading>
            <p className="flex gap-2 text-xl">
              {format(deadline, "dd MMM yyyy - HH:mm")}
              <span className="text-muted-foreground">{timeZoneOffset}</span>
            </p>
          </div>
          <div className="mt-16 flex flex-col gap-4">
            <SubHeading>Task List</SubHeading>
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
        <SubHeading>Task List</SubHeading>
        <p>Nothing to do at this stage</p>
      </div>
    );
  }

  if (stage === Stage.ALLOCATION_PUBLICATION && allocationAccess) {
    return (
      <div className="mt-9 flex flex-col gap-4">
        <SubHeading>Allocations Released</SubHeading>
        <p className="text-lg">
          Check the &ldquo;My Allocations&rdquo; page to view your allocated
          projects
        </p>
      </div>
    );
  }

  return (
    <Unauthorised message="You are not allowed to access the platform at this time" />
  );
}
