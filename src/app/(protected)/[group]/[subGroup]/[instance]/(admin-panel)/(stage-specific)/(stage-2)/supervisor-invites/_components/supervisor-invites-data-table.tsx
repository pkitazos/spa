"use client";

import { type InstanceUserDTO } from "@/dto";

import DataTable from "@/components/ui/data-table/data-table";

import { useSupervisorInvitesColumns } from "./supervisor-invites-columns";

export function SupervisorInvitesDataTable({
  data,
}: {
  data: InstanceUserDTO[];
}) {
  const columns = useSupervisorInvitesColumns();

  return (
    <DataTable
      className="w-full"
      columns={columns}
      filters={[
        {
          columnId: "Status",
          title: "add filters",
          options: [
            { displayName: "Joined", id: "joined" },
            { displayName: "Invited", id: "invited" },
          ],
        },
      ]}
      data={data}
    />
  );
}
