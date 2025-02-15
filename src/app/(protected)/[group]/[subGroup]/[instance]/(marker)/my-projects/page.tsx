import { Stage } from "@prisma/client";

import { AccessControl } from "@/components/access-control";
import { Heading } from "@/components/heading";
import { PanelWrapper } from "@/components/panel-wrapper";
import { Card } from "@/components/ui/card";

import { api } from "@/lib/trpc/server";
import { cn } from "@/lib/utils";
import { InstanceParams } from "@/lib/validations/params";

import { MyProjectsDataTable } from "./_components/my-projects-data-table";

import { app, metadataTitle } from "@/content/config/app";
import { pages } from "@/content/pages";

export async function generateMetadata({ params }: { params: InstanceParams }) {
  const { displayName } = await api.institution.instance.get({ params });

  return {
    title: metadataTitle([pages.myProjects.title, displayName, app.name]),
  };
}

export default async function Page({ params }: { params: InstanceParams }) {
  const { submissionTarget, rowProjects } = await api.user.supervisor.projects({
    params,
  });

  const uniqueProjectIds = new Set(rowProjects.map((project) => project.id));

  return (
    <>
      <Heading>My Projects</Heading>
      <PanelWrapper className="pt-6">
        <AccessControl
          allowedStages={[Stage.PROJECT_SUBMISSION, Stage.PROJECT_SELECTION]}
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
