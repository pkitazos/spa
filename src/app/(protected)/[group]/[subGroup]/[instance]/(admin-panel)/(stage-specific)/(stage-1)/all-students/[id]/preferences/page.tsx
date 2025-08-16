import { notFound } from "next/navigation";

import { metadataTitle, app } from "@/config/meta";
import { PAGES } from "@/config/pages";

import { Stage } from "@/db/types";

import { Heading } from "@/components/heading";
import { LatestSubmissionDataTable } from "@/components/pages/student-preferences/latest-submission-data-table";
import { SubmissionArea } from "@/components/pages/student-preferences/submission-area";
import { PanelWrapper } from "@/components/panel-wrapper";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Unauthorised } from "@/components/unauthorised";

import { api } from "@/lib/trpc/server";
import { type PageParams } from "@/lib/validations/params";

import { CurrentBoardState } from "./_components/current-board-state";

export async function generateMetadata({ params }: { params: PageParams }) {
  const { displayName } = await api.institution.instance.get({ params });
  const { name } = await api.user.getById({ userId: params.id });

  return {
    title: metadataTitle([
      name,
      `${PAGES.studentPreferences.title} for ${PAGES.allStudents.title}`,
      displayName,
      app.name,
    ]),
  };
}

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
  const { student } = await api.user.student.getById({ params, studentId });

  const { initialProjects } =
    await api.user.student.preference.initialBoardState({ params, studentId });

  const latestSubmissionDateTime = await api.user.student.latestSubmission({
    params,
    studentId,
  });

  const restrictions = await api.user.student.preferenceRestrictions({
    params,
  });

  const availableProjects = await api.user.student.getSuitableProjects({
    params,
    studentId,
  });

  return (
    <PanelWrapper>
      <Heading className="flex items-baseline gap-6">
        <p>{PAGES.studentPreferences.title}</p>
        <p className="text-3xl text-muted-foreground">for {student.name}</p>
      </Heading>

      <section className="flex flex-col gap-3">
        <SubmissionArea
          title="Submit student preference list"
          studentId={studentId}
          initialProjects={initialProjects}
          latestSubmissionDateTime={latestSubmissionDateTime}
          restrictions={restrictions}
        />
      </section>

      <Tabs
        searchParamName="tab"
        options={["current-board-state", "last-submission"]}
        defaultValue="current-board-state"
        className="w-full"
      >
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
    </PanelWrapper>
  );
}
