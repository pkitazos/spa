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
      searchableColumn={{ id: "Name", displayName: "Names" }}
      columns={columns}
      filters={[
        {
          columnId: "Status",
          title: "add filters",
          options: [
            { title: "Joined", id: "joined" },
            { title: "Invited", id: "invited" },
          ],
        },
      ]}
      data={data}
    />
  );
}
