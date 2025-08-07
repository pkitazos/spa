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
      columnId: "Status",
      title: "Joined Status",
      options: [
        { title: "Joined", id: "joined" },
        { title: "Invited", id: "invited" },
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
