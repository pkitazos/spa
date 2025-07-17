"use client";

import DataTable from "@/components/ui/data-table/data-table";
import { studentLevelFilter } from "@/components/ui/data-table/data-table-context";

import { type ProjectStudentDto } from "@/lib/validations/dto/preference";

import { useStudentPreferenceColumns } from "./student-preference-columns";

export function StudentPreferenceDataTable({
  data,
}: {
  data: ProjectStudentDto[];
}) {
  const columns = useStudentPreferenceColumns();

  return (
    <DataTable
      searchableColumn={{ id: "Name", displayName: "Names" }}
      columns={columns}
      filters={[studentLevelFilter]}
      data={data}
    />
  );
}
