"use client";
import DataTable from "@/components/ui/data-table/data-table";

import { SupervisorMatchingDetailsDto } from "@/lib/validations/matching";

import { useSupervisorResultsColumns } from "./supervisor-results-columns";
import { UserDTO } from "@/dto";

export function SupervisorResultsDataTable({
  data,
}: {
  data: {
    supervisor: UserDTO;
    matchingDetails: SupervisorMatchingDetailsDto;
  }[];
}) {
  const columns = useSupervisorResultsColumns();
  return (
    <DataTable
      searchableColumn={{ id: "Name", displayName: "Names" }}
      columns={columns}
      data={data}
    />
  );
}
