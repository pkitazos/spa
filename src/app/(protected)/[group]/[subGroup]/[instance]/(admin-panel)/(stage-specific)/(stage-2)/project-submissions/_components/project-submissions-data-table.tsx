"use client";

import DataTable from "@/components/ui/data-table/data-table";

import { useProjectSubmissionColumns } from "./project-submissions-columns";
import { SupervisorDTO } from "@/dto";

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
      searchableColumn={{ id: "Name", displayName: "Names" }}
      columns={columns}
      filters={[
        {
          columnId: "Target Met",
          title: "add filters",
          options: [
            { title: "Target Met", id: "yes" },
            { title: "Target Not Met", id: "no" },
          ],
        },
      ]}
      data={data}
    />
  );
}
