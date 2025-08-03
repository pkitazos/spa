"use client";

import DataTable from "@/components/ui/data-table/data-table";

import { type AllocationByStudentDto } from "@/lib/validations/allocation/data-table-dto";

import { byStudentColumns } from "./by-student-columns";

export function ByStudentDataTable({
  data,
}: {
  data: AllocationByStudentDto[];
}) {
  return (
    <div className="w-full">
      <DataTable
        columns={byStudentColumns}
        data={data}
      />
    </div>
  );
}
