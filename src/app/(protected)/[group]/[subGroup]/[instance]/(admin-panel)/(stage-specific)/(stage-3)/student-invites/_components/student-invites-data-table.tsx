"use client";

import { type FlagDTO, type StudentDTO } from "@/dto";

import DataTable from "@/components/ui/data-table/data-table";

import { useStudentInvitesColumns } from "./student-invites-columns";

export function StudentInvitesDataTable({
  data,
  projectDescriptors,
}: {
  data: StudentDTO[];
  projectDescriptors: { flags: FlagDTO[] };
}) {
  const columns = useStudentInvitesColumns();

  const filters = [
    {
      title: "Joined Status",
      columnId: "Status",
      options: [
        { displayName: "Joined", id: "joined" },
        { displayName: "Invited", id: "invited" },
      ],
    },
    {
      title: "filter by Flag",
      columnId: "Flag",
      options: projectDescriptors.flags.map((flag) => ({
        id: flag.displayName,
        displayName: flag.displayName,
      })),
    },
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
