"use client";

import DataTable from "@/components/ui/data-table/data-table";

import { AllocationByProjectDto } from "@/lib/validations/allocation/data-table-dto";

import { byProjectColumns } from "./by-project-columns";

export function ByProjectDataTable({
  data,
}: {
  data: AllocationByProjectDto[];
}) {
  return (
    <div className="w-full">
      <DataTable
        searchableColumn={{
          id: "Project Title",
          displayName: "Project Titles",
        }}
        columns={byProjectColumns}
        data={data}
      />
    </div>
  );
}
