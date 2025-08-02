"use client";

import DataTable from "@/components/ui/data-table/data-table";

import { type AllocationByProjectDto } from "@/lib/validations/allocation/data-table-dto";

import { byProjectColumns } from "./by-project-columns";

export function ByProjectDataTable({
  data,
}: {
  data: AllocationByProjectDto[];
}) {
  return (
    <div className="w-full">
      <DataTable
        columns={byProjectColumns}
        data={data}
      />
    </div>
  );
}
