"use client";

import DataTable from "@/components/ui/data-table/data-table";
import { studentLevelFilter } from "@/components/ui/data-table/data-table-context";

import { StudentPreferenceSubmissionDto } from "@/lib/validations/dto/preference";

import { usePreferenceSubmissionColumns } from "./preference-submissions-columns";

export function PreferenceSubmissionsDataTable({
  data,
}: {
  data: StudentPreferenceSubmissionDto[];
}) {
  const columns = usePreferenceSubmissionColumns();

  return (
    <DataTable
      className="w-full"
      searchableColumn={{ id: "Name", displayName: "Names" }}
      columns={columns}
      filters={[
        {
          columnId: "Submitted",
          title: "Submission Status",
          options: [
            { title: "Submitted", id: "yes" },
            { title: "Not Submitted", id: "no" },
            { title: "Pre-Allocated", id: "pre-allocated" },
          ],
        },
        studentLevelFilter,
      ]}
      data={data}
    />
  );
}
