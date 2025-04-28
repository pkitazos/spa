"use client";

import {
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ProjectMarkingOverview } from "./row";
import { Fragment, useMemo, useState } from "react";
import { columns, StatusBox } from "./marking-overview-columns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight } from "lucide-react";
import { CopyButton } from "@/components/copy-button";
import { DataTablePagination } from "@/components/ui/data-table/data-table-pagination";
import { Input } from "@/components/ui/input";
import { CopyEmailsButton } from "@/components/copy-emails-button";

export function MarkingOverviewTable({
  data,
}: {
  data: ProjectMarkingOverview[];
}) {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const table = useReactTable<ProjectMarkingOverview>({
    data,
    columns,
    getRowCanExpand: () => true,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnFiltersChange: setColumnFilters,

    state: { columnFilters },
  });

  const overdueMarkerEmails = useMemo(
    () => getOverdueMarkerEmails(data),
    [data],
  );

  const requiresNegotiationEmails = useMemo(
    () => getRequiresNegotiationEmails(data),
    [data],
  );

  return (
    <Fragment>
      <div>
        <CopyEmailsButton
          label="Copy Outstanding Markers"
          data={overdueMarkerEmails}
        />
        <CopyEmailsButton
          label="Copy Markers in ongoing negotiation"
          data={requiresNegotiationEmails}
        />
      </div>
      <div className="flex items-center py-4">
        <Input
          placeholder="Filter projects..."
          value={
            (table.getColumn("project-title")?.getFilterValue() as string) ?? ""
          }
          onChange={(event) =>
            table.getColumn("project-title")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
      </div>
      <DataTablePagination table={table} />
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody className="flex-col space-y-7">
          {table.getRowModel().rows.map((row) => (
            <Fragment key={row.original.project.id}>
              <TableRow>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 p-0"
                    onClick={() => row.toggleExpanded()}
                  >
                    {row.getIsExpanded() ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>
                </TableCell>
                <TableCell colSpan={1}>
                  <span>{row.original.project.title}</span>
                </TableCell>
                <TableCell>{row.original.student.level}</TableCell>
                <TableCell colSpan={1}>
                  <div className="text-sm text-muted-foreground">
                    {row.original.student.name} ({row.original.student.id}{" "}
                    <CopyButton
                      data={row.original.student.id}
                      message="student ID"
                    />
                    )
                  </div>
                </TableCell>
                <TableCell colSpan={1}>
                  <StatusBox status={row.original.status} />
                </TableCell>
              </TableRow>
              {row.getIsExpanded() ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    <Table className="">
                      {row.original.units.map((u) => (
                        <Fragment>
                          <TableRow key={u.unit.id}>
                            <TableCell />
                            <TableCell>
                              {/* <Link
                          href={`./${PAGES.unitsOfAssessment.href}/${u.unit.id}`}
                          className={buttonVariants({ variant: "link" })}
                          > */}
                              {u.unit.title}
                              {/* </Link> */}
                            </TableCell>
                            <TableCell />
                            <TableCell />
                            <TableCell>
                              <StatusBox status={u.status} />
                            </TableCell>
                          </TableRow>
                          {u.markers.map((e) => (
                            <TableRow>
                              <TableCell />
                              <TableCell />
                              <TableCell>{e.markerType}</TableCell>
                              <TableCell>
                                <div className="text-sm text-muted-foreground">
                                  {e.marker.name} ({e.marker.email}{" "}
                                  <CopyButton
                                    data={e.marker.email}
                                    message="student ID"
                                  />
                                  )
                                </div>
                              </TableCell>
                              <TableCell>
                                <StatusBox status={e.status} />
                              </TableCell>
                            </TableRow>
                          ))}
                        </Fragment>
                      ))}
                    </Table>
                  </TableCell>
                </TableRow>
              ) : (
                <Fragment />
              )}
            </Fragment>
          ))}
        </TableBody>
      </Table>
    </Fragment>
  );
}

function getOverdueMarkerEmails(data: ProjectMarkingOverview[]) {
  let log: any = [];
  const emailSet = new Set(
    data.flatMap(({ units, project }) =>
      units.flatMap(({ markers }) =>
        markers
          .filter((m) => m.status.status === "PENDING")
          .map((m) => {
            log.push({
              projectTitle: project.title,
              markerName: m.marker.name,
              type: m.markerType,
            });
            return m.marker.email;
          }),
      ),
    ),
  );

  console.log("overdue submissions:", log);

  return Array.from(emailSet).map((email) => ({ email }));
}

function getRequiresNegotiationEmails(data: ProjectMarkingOverview[]) {
  let log: any[] = [];
  const emailSet = new Set(
    data.flatMap(({ units, project }) =>
      units
        .filter(
          (unit) =>
            unit.markers.every((m) => m.status.status === "MARKED") &&
            unit.status.status === "PENDING" &&
            unit.markers.length === 2,
        )
        .flatMap((unit) => {
          log.push({
            title: project.title,
            markers: unit.markers.map((m) => m.marker.name),
          });
          return unit.markers.map((m) => m.marker.email);
        }),
    ),
  );

  console.log("pending negotiation:", log);

  return Array.from(emailSet).map((email) => ({ email }));
}
