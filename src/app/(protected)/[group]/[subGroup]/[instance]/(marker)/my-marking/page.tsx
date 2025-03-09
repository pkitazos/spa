import { Heading } from "@/components/heading";
import { PanelWrapper } from "@/components/panel-wrapper";

import { api } from "@/lib/trpc/server";
import { InstanceParams } from "@/lib/validations/params";

import { app, metadataTitle } from "@/config/meta";
import { PAGES } from "@/config/pages";
import { SubmissionsTable } from "./_components/submissions-table";
import { MarkerType } from "@/db/types";
import { format } from "date-fns";

export async function generateMetadata({ params }: { params: InstanceParams }) {
  const { displayName } = await api.institution.instance.get({ params });

  return {
    title: metadataTitle([PAGES.myMarking.title, displayName, app.name]),
  };
}

export default async function Page({ params }: { params: InstanceParams }) {
  const data = await api.user.marker.getProjectsToMark({ params });

  console.log("---------------------\n", { data });

  return (
    <>
      <Heading>My Marking</Heading>
      <PanelWrapper className="pt-6">
        <SubmissionsTable
          data={data.map((p) => ({
            id: p.project.id,
            type: "project",
            projectName: p.project.title,
            studentName: p.student.name,
            role:
              p.markerType === MarkerType.SUPERVISOR ? "Supervisor" : "Reader",

            submissions: p.unitsOfAssessment.map((s) => ({
              id: s.id,
              title: s.title,
              dueDate: format(s.markerSubmissionDeadline, "MM/dd/yy"),
              status: "not_open",
            })),
          }))}
        />
      </PanelWrapper>
    </>
  );
}

export type Submission = {
  id: string;
  title: string;
  dueDate?: string;
  status: "mark" | "edit" | "submitted" | "not_open";
};

export type Project = {
  id: string;
  type: "project";
  projectName: string;
  studentName: string;
  role: string;
  submissions: Submission[];
};
