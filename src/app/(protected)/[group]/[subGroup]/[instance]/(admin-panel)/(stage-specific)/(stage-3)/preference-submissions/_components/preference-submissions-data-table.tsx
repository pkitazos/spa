"use client";

import { type FlagDTO } from "@/dto";

import DataTable from "@/components/ui/data-table/data-table";

import { type StudentPreferenceSubmissionDto } from "@/lib/validations/dto/preference";

import { usePreferenceSubmissionColumns } from "./preference-submissions-columns";

export function PreferenceSubmissionsDataTable({
  data,
  projectDescriptors,
}: {
  data: StudentPreferenceSubmissionDto[];
  projectDescriptors: { flags: FlagDTO[] };
}) {
  const columns = usePreferenceSubmissionColumns();

  const studentFlagFilter = {
    title: "filter by Flag",
    columnId: "Flag",
    options: projectDescriptors.flags.map((flag) => ({
      id: flag.displayName,
      title: flag.displayName,
    })),
  };

  const filters = [
    {
      columnId: "Submitted",
      title: "Submission Status",
      options: [
        { title: "Submitted", id: "yes" },
        { title: "Not Submitted", id: "no" },
        { title: "Pre-Allocated", id: "pre-allocated" },
      ],
    },
    studentFlagFilter,
  ];

  return (
    <DataTable
      className="w-full"
      columns={columns}
      filters={filters}
      data={data}
    />
  );
}
