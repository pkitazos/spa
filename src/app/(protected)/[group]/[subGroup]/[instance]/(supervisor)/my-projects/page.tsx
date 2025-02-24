import { AccessControl } from "@/components/access-control";
import { Heading } from "@/components/heading";
import { PanelWrapper } from "@/components/panel-wrapper";
import { Card } from "@/components/ui/card";

import { api } from "@/lib/trpc/server";
import { cn } from "@/lib/utils";
import { InstanceParams } from "@/lib/validations/params";

import { MyProjectsDataTable } from "./_components/my-projects-data-table";

import { app, metadataTitle } from "@/config/meta";
import { PAGES } from "@/config/pages";
import { Stage } from "@/db/types";

export async function generateMetadata({ params }: { params: InstanceParams }) {
  const { displayName } = await api.institution.instance.get({ params });

  return {
    title: metadataTitle([PAGES.myProjects.title, displayName, app.name]),
  };
}

export default async function Page({ params }: { params: InstanceParams }) {
  const { submissionTarget } = await api.user.supervisor.projectStats({
    params,
  });

  const rowProjects = await api.user.supervisor.rowProjects({ params });
  const uniqueProjectIds = new Set(rowProjects.map((project) => project.id));

  return (
    <>
      <Heading>My Projects</Heading>
      <PanelWrapper className="pt-6">
        <AccessControl
          allowedStages={[Stage.PROJECT_SUBMISSION, Stage.STUDENT_BIDDING]}
        >
          <Card className="flex justify-between px-10 py-5">
            <h2
              className={cn(
                "text-lg font-medium",
                submissionTarget <= 0 && "text-muted-foreground",
              )}
            >
              Submission Target
            </h2>
            {submissionTarget > 0 && (
              <p
                className={cn(
                  "text-lg font-medium",
                  uniqueProjectIds.size < submissionTarget &&
                    "text-destructive",
                  uniqueProjectIds.size >= submissionTarget && "text-green-500",
                )}
              >
                {uniqueProjectIds.size} / {submissionTarget}
              </p>
            )}
          </Card>
        </AccessControl>
        <MyProjectsDataTable projects={rowProjects} />
      </PanelWrapper>
    </>
  );
}
