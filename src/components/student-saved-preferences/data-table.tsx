"use client";

import DataTable from "@/components/ui/data-table/data-table";

import {
  type SavedPreferenceData,
  useSavedPreferencesColumns,
} from "./columns";

export function StudentSavedPreferenceDataTable({
  data,
}: {
  data: SavedPreferenceData[];
}) {
  const columns = useSavedPreferencesColumns();

  return <DataTable className="w-full" columns={columns} data={data} />;
}
