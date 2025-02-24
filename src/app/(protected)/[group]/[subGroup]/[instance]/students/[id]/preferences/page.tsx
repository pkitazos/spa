import { notFound } from "next/navigation";

import { AccessControl } from "@/components/access-control";
import { Heading } from "@/components/heading";
import { PageWrapper } from "@/components/page-wrapper";
import { LatestSubmissionDataTable } from "@/components/pages/student-preferences/latest-submission-data-table";
import { SubmissionArea } from "@/components/pages/student-preferences/submission-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Unauthorised } from "@/components/unauthorised";

import { api } from "@/lib/trpc/server";
import { PageParams } from "@/lib/validations/params";

import { CurrentBoardState } from "./_components/current-board-state";

import { Stage } from "@/db/types";

export default async function Page({ params }: { params: PageParams }) {
  const studentId = params.id;
  const exists = await api.user.student.exists({ params, studentId });
  if (!exists) notFound();

  const stage = await api.institution.instance.currentStage({ params });
  if (stage !== Stage.STUDENT_BIDDING) {
    return (
      <Unauthorised message="You are not allowed to access this resource at this time" />
    );
  }
  const student = await api.user.student.getById({ params, studentId });

  const { initialProjects } =
    await api.user.student.preference.initialBoardState({ params, studentId });

  const latestSubmissionDateTime = await api.user.student.latestSubmission({
    params,
    studentId,
  });

  const restrictions = await api.user.student.preferenceRestrictions({
    params,
  });

  const availableProjects = await api.project.getAllForStudentPreferences({
    params,
    studentId,
  });

  return (
    <PageWrapper>
      <Heading className="flex items-baseline gap-6">
        <p>Preferences</p>
        <p className="text-3xl text-muted-foreground">for {student.name}</p>
      </Heading>
      <AccessControl allowedStages={[Stage.STUDENT_BIDDING]}>
        <section className="flex flex-col gap-3">
          <SubmissionArea
            title="Submit student preference list"
            studentId={studentId}
            initialProjects={initialProjects}
            latestSubmissionDateTime={latestSubmissionDateTime}
            restrictions={restrictions}
          />
        </section>
      </AccessControl>
      <Tabs defaultValue="current-board-state" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger
            className="w-full data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground"
            value="current-board-state"
          >
            Working Board
          </TabsTrigger>
          <TabsTrigger
            className="w-full data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground"
            value="last-submission"
          >
            Latest Submission
          </TabsTrigger>
        </TabsList>
        <Separator className="my-4" />
        <TabsContent value="current-board-state">
          <CurrentBoardState
            availableProjects={availableProjects}
            initialProjects={initialProjects}
          />
        </TabsContent>
        <TabsContent value="last-submission">
          <LatestSubmissionDataTable studentId={studentId} />
        </TabsContent>
      </Tabs>
    </PageWrapper>
  );
}
