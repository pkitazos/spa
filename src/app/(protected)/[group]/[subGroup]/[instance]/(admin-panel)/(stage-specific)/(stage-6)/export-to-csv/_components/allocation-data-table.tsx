"use client";
import DataTable from "@/components/ui/data-table/data-table";

import { AllocationCsvData } from "@/lib/validations/allocation-csv-data";

import { columns } from "./allocation-columns";

export function AllocationDataTable({ data }: { data: AllocationCsvData[] }) {
  return <DataTable columns={columns} data={data} />;
}
