"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { EditIcon } from "lucide-react";
import Link from "next/link";

import { INSTITUTION } from "@/config/institution";
import { PAGES } from "@/config/pages";

import { type UserDTO } from "@/dto";

import { buttonVariants } from "@/components/ui/button";
import { DataTableColumnHeader } from "@/components/ui/data-table/data-table-column-header";

import { cn } from "@/lib/utils";

export const useUserManagementColumns = [
  {
    id: "id",
    accessorKey: "id",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={INSTITUTION.ID_NAME} />
    ),
  },
  {
    id: "name",
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
  },
  {
    id: "email",
    accessorKey: "email",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Email" />
    ),
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row: { original: user } }) => (
      <div className="flex w-14 items-center justify-center gap-2">
        <Link
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "w-10 h-10",
          )}
          href={`/${PAGES.superAdminPanel.href}/${PAGES.userManagement.href}/${user.id}`}
        >
          <EditIcon className="h-4 w-4" />
        </Link>
      </div>
    ),
  },
] satisfies ColumnDef<UserDTO>[];
