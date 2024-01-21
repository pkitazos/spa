import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTableColumnHeader } from "@/components/ui/data-table/data-table-column-header";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ColumnDef } from "@tanstack/react-table";
import { LucideMoreHorizontal, Trash2 } from "lucide-react";
import Link from "next/link";

export interface SupervisorData {
  supervisor: {
    id: string;
    name: string;
    email: string;
  };
}

export const columns: ColumnDef<SupervisorData>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    id: "name",
    accessorFn: ({ supervisor }) => supervisor.name,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" canFilter />
    ),
    cell: ({
      row: {
        original: {
          supervisor: { id, name },
        },
      },
    }) => (
      <Button variant="link">
        <Link href={`supervisors/${id}`}>{name}</Link>
      </Button>
    ),
  },
  {
    id: "email",
    accessorFn: ({ supervisor }) => supervisor.email,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Email" />
    ),
  },
  {
    id: "actions",
    accessorKey: "actions",
    header: () => {
      return <div className="text-xs text-gray-500">Actions</div>;
    },
    cell: ({
      row: {
        original: { supervisor },
      },
    }) => {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <LucideMoreHorizontal className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <a href={`/supervisors/${supervisor.id}`}>
                <Button variant="link">View Details</Button>
              </a>
            </DropdownMenuItem>
            {false && (
              <DropdownMenuItem>
                {/* // TODO: implement delete */}
                <Button
                  className="w-full"
                  variant="destructive"
                  onClick={() => {
                    return;
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];