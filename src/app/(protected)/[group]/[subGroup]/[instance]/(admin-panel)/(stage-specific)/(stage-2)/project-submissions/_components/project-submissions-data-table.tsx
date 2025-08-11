"use client";

import { type SupervisorDTO } from "@/dto";

import DataTable from "@/components/ui/data-table/data-table";

import { useProjectSubmissionColumns } from "./project-submissions-columns";

export function ProjectSubmissionsDataTable({
  data,
}: {
  data: {
    supervisor: SupervisorDTO;
    submittedProjectsCount: number;
    submissionTarget: number;
    targetMet: boolean;
  }[];
}) {
  const columns = useProjectSubmissionColumns();

  return (
    <DataTable
      className="w-full"
      columns={columns}
      filters={[
        {
          columnId: "Target Met",
          title: "add filters",
          options: [
            { displayName: "Target Met", id: "yes" },
            { displayName: "Target Not Met", id: "no" },
          ],
        },
      ]}
      data={data}
    />
  );
}
