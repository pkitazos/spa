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

import { type InstanceUserDTO } from "@/dto";

import { ExportCSVButton } from "@/components/export-csv";
import { usePathInInstance } from "@/components/params-context";
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

import { copyToClipboard } from "@/lib/utils/general/copy-to-clipboard";

export function useSupervisorInvitesColumns(): ColumnDef<InstanceUserDTO>[] {
  const { getPath } = usePathInInstance();

  const selectCol = getSelectColumn<InstanceUserDTO>();

  const baseCols: ColumnDef<InstanceUserDTO>[] = [
    {
      id: "Name",
      accessorFn: (s) => s.name,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
      ),
      cell: ({
        row: {
          original: { id, name },
        },
      }) => (
        <Link
          className={buttonVariants({ variant: "link" })}
          href={getPath(`${PAGES.allSupervisors.href}/${id}`)}
        >
          {name}
        </Link>
      ),
    },
    {
      id: INSTITUTION.ID_NAME,
      accessorFn: (s) => s.id,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={INSTITUTION.ID_NAME} />
      ),
    },
    {
      id: "Email",
      accessorFn: (s) => s.email,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Email" />
      ),
    },
    {
      id: "Status",
      accessorFn: (s) => s.joined,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({
        row: {
          original: { joined },
        },
      }) =>
        joined ? (
          <Badge className="bg-green-700">joined</Badge>
        ) : (
          <Badge className="bg-muted-foreground">invited</Badge>
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
                {count} of {rows.length} supervisors have joined the platform at
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
                      filename="supervisor-invites"
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
                  href={`./${PAGES.allSupervisors.href}/${id}`}
                >
                  <CornerDownRightIcon className="h-4 w-4" />
                  <span>View supervisor details</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="group/item">
                <Link
                  className="flex items-center gap-2 text-primary underline-offset-4 group-hover/item:underline hover:underline"
                  href={`./${PAGES.allSupervisors.href}/${id}?edit=true`}
                >
                  <PenIcon className="h-4 w-4" />
                  <span>Edit supervisor details</span>
                </Link>
              </DropdownMenuItem>
              {/* // TODO: make the actual email be click-copyable instead */}
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
