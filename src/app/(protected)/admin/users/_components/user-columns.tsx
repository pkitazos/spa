"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { EditIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { INSTITUTION } from "@/config/institution";
import { PAGES } from "@/config/pages";

import { type UserDTO } from "@/dto";

import { buttonVariants } from "@/components/ui/button";

import { cn } from "@/lib/utils";

export const useUserManagementColumns = () => {
  const router = useRouter();

  return [
    { id: "id", accessorKey: "id", header: INSTITUTION.ID_NAME },
    { id: "name", accessorKey: "name", header: "Name" },
    { id: "email", accessorKey: "email", header: "Email" },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const user = row.original;

        return (
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
        );
      },
    },
  ] satisfies ColumnDef<UserDTO>[];
};
