import { type ColumnDef } from "@tanstack/react-table";
import {
  CopyIcon,
  CornerDownRightIcon,
  MoreHorizontalIcon as MoreIcon,
  PenIcon,
} from "lucide-react";
import Link from "next/link";

import { PAGES } from "@/config/pages";

import { ExportCSVButton } from "@/components/export-csv";
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
import { type StudentInviteDto } from "@/lib/validations/dto/student";

export function useStudentInvitesColumns(): ColumnDef<StudentInviteDto>[] {
  const selectCol = getSelectColumn<StudentInviteDto>();

  const baseCols: ColumnDef<StudentInviteDto>[] = [
    {
      id: "Name",
      accessorFn: (s) => s.name,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
      ),
      cell: ({
        row: {
          original: { name, id },
        },
      }) => (
        <Link
          className={cn(buttonVariants({ variant: "link" }), "pl-0")}
          href={`./${PAGES.allStudents.href}/${id}`}
        >
          {name}
        </Link>
      ),
    },
    {
      id: "GUID",
      accessorFn: (s) => s.id,
      header: ({ column }) => (
        <DataTableColumnHeader
          className="w-36"
          column={column}
          title="GUID"
          canFilter
        />
      ),
      cell: ({ row }) => (
        <p className="w-36 text-center text-sm">{row.original.id}</p>
      ),
    },
    {
      id: "Email",
      accessorFn: (s) => s.email,
      header: ({ column }) => (
        <DataTableColumnHeader className="w-44" column={column} title="Email" />
      ),
      cell: ({ row }) => (
        <p className="w-44 text-center text-sm">{row.original.email}</p>
      ),
    },
    {
      id: "Level",
      accessorFn: ({ level }) => level,
      header: ({ column }) => (
        <DataTableColumnHeader className="w-20" column={column} title="Level" />
      ),
      cell: ({
        row: {
          original: { level },
        },
      }) => (
        <div className="grid w-20 place-items-center">
          <Badge variant="accent">{level}</Badge>
        </div>
      ),
      filterFn: (row, columnId, value) => {
        const selectedFilters = value as ("4" | "5")[];
        // TODO: fix
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
        const rowValue = row.getValue(columnId) as 4 | 5;
        console.log({ selectedFilters });
        const studentLevel = rowValue.toString() as "4" | "5";
        return selectedFilters.includes(studentLevel);
      },
    },
    {
      id: "Status",
      accessorFn: (s) => s.joined,
      header: ({ column }) => (
        <DataTableColumnHeader
          className="w-24"
          column={column}
          title="Status"
        />
      ),
      cell: ({
        row: {
          original: { joined },
        },
      }) =>
        joined ? (
          <div className="grid w-24 place-items-center">
            <Badge className="bg-green-700">joined</Badge>
          </div>
        ) : (
          <div className="grid w-24 place-items-center">
            <Badge className="bg-muted-foreground">invited</Badge>
          </div>
        ),
      filterFn: (row, columnId, value) => {
        const selectedFilters = value as ("joined" | "invited")[];
        const rowValue = row.getValue(columnId);
        const joined = rowValue ? "joined" : "invited";
        return selectedFilters.includes(joined);
      },
      footer: ({ table }) => {
        const rows = table.getCoreRowModel().rows;
        const count = rows.reduce(
          (acc, { original: r }) => (r.joined ? acc + 1 : acc),
          0,
        );
        return (
          <WithTooltip
            tip={
              <p>
                {count} of {rows.length} students have joined the platform at
                least once
              </p>
            }
          >
            <p className="w-full text-center">
              Joined:{" "}
              <span className="underline decoration-slate-400 decoration-dotted underline-offset-2">
                {count} / {rows.length}
              </span>
            </p>
          </WithTooltip>
        );
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
            r.name,
            r.id,
            r.email,
            r.joined ? 1 : 0,
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
                      filename="student-invites"
                      text="Download selected rows"
                      header={["Name", "GUID", "Email", "Joined"]}
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
          original: { id, name, email },
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
                <span className="ml-2 text-muted-foreground">for {name}</span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="group/item">
                <Link
                  className="flex items-center gap-2 text-primary underline-offset-4 group-hover/item:underline hover:underline"
                  href={`./${PAGES.allStudents.href}/${id}`}
                >
                  <CornerDownRightIcon className="h-4 w-4" />
                  <span>View student details</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="group/item">
                <Link
                  className="flex items-center gap-2 text-primary underline-offset-4 group-hover/item:underline hover:underline"
                  href={`./${PAGES.allStudents.href}/${id}?edit=true`}
                >
                  <PenIcon className="h-4 w-4" />
                  <span>Edit student details</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="group/item">
                <button
                  className="flex items-center gap-2 text-sm text-primary underline-offset-4 group-hover/item:underline hover:underline"
                  onClick={async () => await copyToClipboard(email)}
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
