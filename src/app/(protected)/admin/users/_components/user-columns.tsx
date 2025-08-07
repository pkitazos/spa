"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { EditIcon, Trash2Icon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { INSTITUTION } from "@/config/institution";
import { PAGES } from "@/config/pages";

import { type UserDTO } from "@/dto";

import { Button, buttonVariants } from "@/components/ui/button";
import { WithTooltip } from "@/components/ui/tooltip-wrapper";
import { YesNoAction } from "@/components/yes-no-action";

import { api } from "@/lib/trpc/client";
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
        // ! this is not how we do things bro
        const { mutateAsync: api_delete } = api.user.deleteById.useMutation();

        const user = row.original;

        return (
          <div className="flex w-14 items-center justify-center gap-2">
            <YesNoAction
              title="Deleted User"
              description={`You're about to delete ${user.name} (${user.id}) from the system. This is permanent and cannot be undone. Are you sure you wish to proceed?`}
              action={() =>
                void toast
                  .promise(api_delete({ userId: user.id }), {
                    loading: "Deleting User...",
                    success: (data) =>
                      `Successfully deleted user ${data.name} (${data.id})`,
                    error: `Failed to delete user`,
                  })
                  .unwrap()
                  .then(() => router.refresh())
              }
              trigger={
                <WithTooltip tip="Delete user">
                  <Button variant="destructive" className="w-10 h-10">
                    <Trash2Icon className="h-4 w-4" />
                  </Button>
                </WithTooltip>
              }
            />
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
