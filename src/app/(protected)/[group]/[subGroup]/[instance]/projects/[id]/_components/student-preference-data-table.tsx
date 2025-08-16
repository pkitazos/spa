"use client";

import { type FlagDTO, type StudentDTO } from "@/dto";

import { type ExtendedPreferenceType } from "@/db/types";

import DataTable from "@/components/ui/data-table/data-table";

import { useStudentPreferenceColumns } from "./student-preference-columns";

export function StudentPreferenceDataTable({
  data,
  projectDescriptors,
}: {
  data: {
    student: StudentDTO;
    preference: { type: ExtendedPreferenceType; rank?: number };
  }[];
  projectDescriptors: { flags: FlagDTO[] };
}) {
  const columns = useStudentPreferenceColumns();

  const studentFlagFilter = {
    title: "filter by Flag",
    columnId: "Flag",
    options: projectDescriptors.flags.map((flag) => ({
      id: flag.displayName,
      displayName: flag.displayName,
    })),
  };

  return (
    <DataTable columns={columns} filters={[studentFlagFilter]} data={data} />
  );
}
