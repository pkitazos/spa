"use client";

import DataTable from "@/components/ui/data-table/data-table";
import { ReaderProjectData, useMyReadingsColumns } from "./my-readings-columns";

export function MyReadingsDataTable({
  projects,
}: {
  projects: ReaderProjectData[];
}) {
  const columns = useMyReadingsColumns();

  return (
    <DataTable
      searchableColumn={{ id: "Project Title", displayName: "Project Titles" }}
      columns={columns}
      data={projects}
    />
  );
}
