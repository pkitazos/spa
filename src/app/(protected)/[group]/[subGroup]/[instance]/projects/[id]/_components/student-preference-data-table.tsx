"use client";

import { type StudentDTO } from "@/dto";

import { type ExtendedPreferenceType } from "@/db/types";

import DataTable from "@/components/ui/data-table/data-table";
import { studentLevelFilter } from "@/components/ui/data-table/data-table-context";

import { useStudentPreferenceColumns } from "./student-preference-columns";

export function StudentPreferenceDataTable({
  data,
}: {
  data: {
    student: StudentDTO;
    preference: { type: ExtendedPreferenceType; rank?: number };
  }[];
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
