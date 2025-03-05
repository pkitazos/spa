"use client";

import DataTable from "@/components/ui/data-table/data-table";

import { ProjectSubmissionDto } from "@/lib/validations/dto/project";

import { useProjectSubmissionColumns } from "./project-submissions-columns";

export function ProjectSubmissionsDataTable({
  data,
}: {
  data: ProjectSubmissionDto[];
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
