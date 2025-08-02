import { type ColumnDef } from "@tanstack/react-table";
import {
  CopyIcon,
  CornerDownRightIcon,
  MoreHorizontalIcon as MoreIcon,
  PenIcon,
} from "lucide-react";
import Link from "next/link";

import { INSTITUTION } from "@/config/institution";
import { PAGES } from "@/config/pages";

import { ExportCSVButton } from "@/components/export-csv";
import { CircleCheckSolidIcon } from "@/components/icons/circle-check";
import { CircleXIcon } from "@/components/icons/circle-x";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { ActionColumnLabel } from "@/components/ui/data-table/action-column-label";
import { DataTableColumnHeader } from "@/components/ui/data-table/data-table-column-header";
import { getSelectColumn } from "@/components/ui/data-table/select-column";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { WithTooltip } from "@/components/ui/tooltip-wrapper";

import { cn } from "@/lib/utils";
import { copyToClipboard } from "@/lib/utils/general/copy-to-clipboard";
import { type StudentPreferenceSubmissionDto } from "@/lib/validations/dto/preference";

export function usePreferenceSubmissionColumns(): ColumnDef<StudentPreferenceSubmissionDto>[] {
  const selectCol = getSelectColumn<StudentPreferenceSubmissionDto>();

  const baseCols: ColumnDef<StudentPreferenceSubmissionDto>[] = [
    {
      id: INSTITUTION.ID_NAME,
      accessorFn: (s) => s.student.id,
      header: ({ column }) => (
        <DataTableColumnHeader
          className="w-28"
          column={column}
          title={INSTITUTION.ID_NAME}
          canFilter
        />
      ),
    },
    {
      id: "Name",
      accessorFn: (s) => s.student.name,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
      ),
      cell: ({
        row: {
          original: { student },
        },
      }) => (
        <Link
          className={buttonVariants({ variant: "link" })}
          href={`./${PAGES.allStudents.href}/${student.id}`}
        >
          {student.name}
        </Link>
      ),
    },
    {
      id: "Email",
      accessorFn: (s) => s.student.email,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Email" />
      ),
    },
    {
      id: "Flag",
      accessorFn: (s) => s.student.flag.id,
      header: ({ column }) => (
        <DataTableColumnHeader className="w-20" column={column} title="Flag" />
      ),
      cell: ({
        row: {
          original: { student },
        },
      }) => (
        <div className="grid w-20 place-items-center">
          <Badge variant="accent">{student.flag.displayName}</Badge>
        </div>
      ),
      filterFn: (row, columnId, value) => {
        const selectedFilters = value as ("4" | "5")[];
        // TODO: fix this
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
        const rowValue = row.getValue(columnId) as 4 | 5;
        console.log({ selectedFilters });
        const studentLevel = rowValue.toString() as "4" | "5";
        return selectedFilters.includes(studentLevel);
      },
    },
    {
      id: "Count",
      accessorFn: (s) => s.submissionCount,
      header: ({ column }) => (
        <DataTableColumnHeader className="w-28" column={column} title="Count" />
      ),
      cell: ({
        row: {
          original: { submissionCount },
        },
      }) => <p className="w-full text-center">{submissionCount}</p>,
    },
    {
      id: "Submitted",
      accessorFn: (s) => s.submitted,
      header: "Submitted",
      cell: ({
        row: {
          original: { submitted, preAllocated },
        },
      }) => {
        if (preAllocated) {
          return (
            <WithTooltip tip={"This student self-defined a project"}>
              <div className="flex items-center justify-center">
                <CircleCheckSolidIcon className="h-4 w-4 fill-blue-500" />
              </div>
            </WithTooltip>
          );
        }

        const Icon = submitted ? CircleCheckSolidIcon : CircleXIcon;

        return (
          <div className="flex items-center justify-center">
            <Icon
              className={cn(
                "h-4 w-4",
                submitted ? "fill-green-500" : "fill-destructive",
              )}
            />
          </div>
        );
      },
      filterFn: (row, _, value) => {
        const selectedFilters = value as ("yes" | "no" | "pre-allocated")[];

        const preAllocated = row.original.preAllocated;
        if (preAllocated) return selectedFilters.includes("pre-allocated");

        const submitted = row.original.submitted ? "yes" : "no";
        return selectedFilters.includes(submitted);
      },
    },
    {
      accessorKey: "actions",
      id: "Actions",
      header: ({ table }) => {
        const someSelected =
          table.getIsAllPageRowsSelected() || table.getIsSomePageRowsSelected();

        const data = table
          .getSelectedRowModel()
          .rows.map(({ original: r }) => [
            r.student.id,
            r.student.name,
            r.student.email,
            r.submissionCount,
            r.submitted ? 1 : 0,
          ]);

        if (someSelected)
          return (
            <div className="flex w-14 items-center justify-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="icon" variant="ghost">
                    <span className="sr-only">Open menu</span>
                    <MoreIcon className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" side="bottom">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="flex items-center gap-2 text-primary">
                    <ExportCSVButton
                      filename="preference-submissions"
                      text="Download selected rows"
                      header={["GUID", "Name", "Email", "Count", "Submitted"]}
                      data={data}
                    />
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );

        return <ActionColumnLabel />;
      },
      cell: ({
        row: {
          original: { student },
        },
      }) => (
        <div className="flex w-14 items-center justify-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost">
                <span className="sr-only">Open menu</span>
                <MoreIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" side="bottom">
              <DropdownMenuLabel>
                Actions
                <span className="ml-2 text-muted-foreground">
                  for {student.name}
                </span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="group/item">
                <Link
                  className="flex items-center gap-2 text-primary underline-offset-4 group-hover/item:underline hover:underline"
                  href={`./${PAGES.allStudents.href}/${student.id}`}
                >
                  <CornerDownRightIcon className="h-4 w-4" />
                  <span>View student details</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="group/item">
                <Link
                  className="flex items-center gap-2 text-primary underline-offset-4 group-hover/item:underline hover:underline"
                  href={`./${PAGES.allStudents.href}/${student.id}?edit=true`}
                >
                  <PenIcon className="h-4 w-4" />
                  <span>Edit student details</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="group/item">
                <button
                  className="flex items-center gap-2 text-sm text-primary underline-offset-4 group-hover/item:underline hover:underline"
                  onClick={async () => await copyToClipboard(student.email)}
                >
                  <CopyIcon className="h-4 w-4" />
                  <span>Copy email</span>
                </button>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];
  return [selectCol, ...baseCols];
}
