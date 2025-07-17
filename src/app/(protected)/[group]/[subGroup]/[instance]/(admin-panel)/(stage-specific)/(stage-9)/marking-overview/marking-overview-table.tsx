"use client";

import { Fragment, useCallback, useMemo, useState } from "react";

import {
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ChevronDown, ChevronRight, Send } from "lucide-react";
import { toast } from "sonner";

import { CopyButton } from "@/components/copy-button";
import { CopyEmailsButton } from "@/components/copy-emails-button";
import { ExportCSVButton } from "@/components/export-csv";
import { useInstanceParams } from "@/components/params-context";
import { Button } from "@/components/ui/button";
import { DataTablePagination } from "@/components/ui/data-table/data-table-pagination";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { YesNoAction } from "@/components/yes-no-action";

import { api } from "@/lib/trpc/client";

import { columns, StatusBox } from "./marking-overview-columns";
import { prepCSV } from "./prep-csv";
import { type ProjectMarkingOverview } from "./row";

export function MarkingOverviewTable({
  data,
}: {
  data: ProjectMarkingOverview[];
}) {
  const params = useInstanceParams();

  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const { mutateAsync: sendOverdueReminder } =
    api.marking.sendOverdueMarkingReminder.useMutation();

  const { mutateAsync: sendNegotiationReminder } =
    api.marking.sendOverdueNegotiationReminder.useMutation();

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

  const overdueReminderAction = useCallback(() => {
    toast.promise(
      sendOverdueReminder({ params, markers: overdueMarkerEmails }),
      {
        loading: "Sending...",
        success: `Successfully sent ${overdueMarkerEmails.length} reminder emails`,
        error: `Failed to send emails`,
      },
    );
  }, [overdueMarkerEmails, params, sendOverdueReminder]);

  const overdueNegotiationAction = useCallback(() => {
    toast.promise(
      sendNegotiationReminder({ params, markers: requiresNegotiationEmails }),
      {
        loading: "Sending...",
        success: `Successfully sent ${requiresNegotiationEmails.length} reminder emails`,
        error: `Failed to send emails`,
      },
    );
  }, [params, requiresNegotiationEmails, sendNegotiationReminder]);

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
      <div className="flex flex-row gap-1 py-1">
        <YesNoAction
          action={overdueReminderAction}
          title={`Send marking reminders`}
          description={`You are about to send a late reminder to ${overdueMarkerEmails.length} markers. Do you wish to proceed?`}
          trigger={
            <Button className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              <p>send marking overdue reminder</p>
            </Button>
          }
        />
        <YesNoAction
          action={overdueNegotiationAction}
          title={`Send negotiation reminders`}
          description={`You are about to send a late reminder to ${requiresNegotiationEmails.length} markers. Do you wish to proceed?`}
          trigger={
            <Button className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              <p>send negotiation overdue reminder</p>
            </Button>
          }
        />
      </div>
      <div>
        <ExportCSVButton
          header={[
            "studentGUID",
            "studentName",
            "studentLevel",
            "studentEmail",
            "projectTitle",

            "supervsorName",
            "supervisorEmail",
            "readerName",
            "readerEmail",

            "moderatorName",
            "moderatorEmail",

            "presentationGrade",
            "presentationComments",
            "conductGrade",
            "conductComments",

            "supervisorDissertationGrade",
            "supervisorDissertationComments",
            "readerDissertationGrade",
            "readerDissertationComments",

            "requiredNegotiation",
            "negotiatedGrade",
            "negotiatedComment",

            "requiredModeration",
            "moderatedGrade",
            "moderationComments",

            "finalDissertationGrade",
            "overallGrade",
            "penalty",
          ]}
          data={prepCSV(data)}
          filename={"marking"}
          text="Download as CSV"
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
                        <Fragment key={u.unit.id}>
                          <TableRow>
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
                            <TableRow key={e.marker.id}>
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
  const emailSet = new Set(
    data.flatMap(({ units }) =>
      units.flatMap(({ markers }) =>
        markers
          .filter((m) => m.status.status === "PENDING")
          .map((m) => m.marker.email),
      ),
    ),
  );

  return Array.from(emailSet).map((email) => ({ email }));
}

function getRequiresNegotiationEmails(data: ProjectMarkingOverview[]) {
  const emailSet = new Set(
    data.flatMap(({ units }) =>
      units
        .filter(
          (unit) =>
            unit.markers.every((m) => m.status.status === "MARKED") &&
            unit.status.status === "PENDING" &&
            unit.markers.length === 2,
        )
        .flatMap((unit) => unit.markers.map((m) => m.marker.email)),
    ),
  );

  return Array.from(emailSet).map((email) => ({ email }));
}
