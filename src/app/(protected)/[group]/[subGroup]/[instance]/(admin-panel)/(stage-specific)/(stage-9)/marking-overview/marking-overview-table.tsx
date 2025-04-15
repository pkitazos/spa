"use client";

import {
  ColumnFiltersState,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { MarkingOverviewRow } from "./row";
import { Fragment, useState } from "react";
import { columns } from "./marking-overview-columns";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Table, TableRow } from "@/components/ui/table";

export function MarkingOverviewTable({ data }: { data: MarkingOverviewRow[] }) {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const table = useReactTable<MarkingOverviewRow>({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowCanExpand: () => true,
    getFilteredRowModel: getFilteredRowModel(),
    onColumnFiltersChange: setColumnFilters,

    state: { columnFilters },
  });

  return (
    <Table>
      {table.getRowModel().rows.map((row) => (
        <Fragment key={row.id}>
          <TableRow>
            <Button onClick={row.getToggleExpandedHandler()}>
              {row.getIsExpanded() ? <ChevronRight /> : <ChevronDown />}
            </Button>
          </TableRow>
          {row.subRows.map((subrow) => (
            <Fragment key={subrow.id}>
              <TableRow></TableRow>
            </Fragment>
          ))}
        </Fragment>
      ))}
    </Table>
  );
}
