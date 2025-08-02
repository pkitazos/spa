"use client";

import { type StudentDTO } from "@/dto";

import DataTable from "@/components/ui/data-table/data-table";
import { studentLevelFilter } from "@/components/ui/data-table/data-table-context";

import { useStudentInvitesColumns } from "./student-invites-columns";

export function StudentInvitesDataTable({ data }: { data: StudentDTO[] }) {
  const columns = useStudentInvitesColumns();

  return (
    <DataTable
      className="w-full"
      searchableColumn={{ id: "Name", displayName: "Names" }}
      columns={columns}
      filters={[
        {
          columnId: "Status",
          title: "Joined Status",
          options: [
            { title: "Joined", id: "joined" },
            { title: "Invited", id: "invited" },
          ],
        },
        studentLevelFilter,
      ]}
      data={data}
    />
  );
}
