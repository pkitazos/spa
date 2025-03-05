"use client";

import DataTable from "@/components/ui/data-table/data-table";

import { SupervisorInviteDto } from "@/lib/validations/dto/supervisor";

import { useSupervisorInvitesColumns } from "./supervisor-invites-columns";

export function SupervisorInvitesDataTable({
  data,
}: {
  data: SupervisorInviteDto[];
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
