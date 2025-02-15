"use client";

import DataTable from "@/components/ui/data-table/data-table";

import { MarkingProjectData, useMyMarkingColumns } from "./my-marking-columns";

export function MyMarkingDataTable({
  projects,
}: {
  projects: MarkingProjectData[];
}) {
  const columns = useMyMarkingColumns();

  return (
    <DataTable
      searchableColumn={{ id: "Project Title", displayName: "Project Titles" }}
      columns={columns}
      data={projects}
    />
  );
}
