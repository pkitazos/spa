"use client";

import DataTable from "@/components/ui/data-table/data-table";

import { type SavedPreferenceDto } from "@/lib/validations/dto/preference";

import { useSavedPreferencesColumns } from "./columns";

export function StudentSavedPreferenceDataTable({
  data,
}: {
  data: SavedPreferenceDto[];
}) {
  const columns = useSavedPreferencesColumns();

  return (
    <DataTable
      searchableColumn={{ id: "Title", displayName: "Project Title" }}
      className="w-full"
      columns={columns}
      data={data}
    />
  );
}
