"use client";

import { DialogTrigger } from "@radix-ui/react-dialog";
import { type ColumnDef } from "@tanstack/react-table";
import { PenIcon, Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { INSTITUTION } from "@/config/institution";

import { type UserDTO } from "@/dto";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { WithTooltip } from "@/components/ui/tooltip-wrapper";
import { YesNoAction } from "@/components/yes-no-action";

import { api } from "@/lib/trpc/client";

export const columns = [
  { id: "id", accessorKey: "id", header: INSTITUTION.ID_NAME },
  { id: "name", accessorKey: "name", header: "Name" },
  { id: "email", accessorKey: "email", header: "Email" },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const { mutateAsync: api_delete } = api.user.deleteById.useMutation();

      // eslint-disable-next-line react-hooks/rules-of-hooks
      const router = useRouter();

      return (
        <div className="flex w-14 items-center justify-center gap-2">
          <YesNoAction
            title="Deleted User"
            description={`You're about to delete ${row.original.name} (${row.original.id}) from the system. This is permanent and cannot be undone. Are you sure you wish to proceed?`}
            action={() =>
              void toast
                .promise(api_delete({ userId: row.original.id }), {
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
                <Button variant="destructive" className="flex items-center">
                  <Trash2Icon className="h-4 w-4" />
                </Button>
              </WithTooltip>
            }
          />
          <Dialog>
            <DialogTrigger>
              <WithTooltip tip="Edit user details">
                <Button>
                  <PenIcon className="h-4 w-4" />
                </Button>
              </WithTooltip>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit user details</DialogTitle>
                <DialogDescription></DialogDescription>
              </DialogHeader>
              <EditUserDetailsForm user={row.original} />
              <DialogFooter className="sm:justify-start">
                <DialogClose asChild>
                  <Button type="button" variant="secondary">
                    Close
                  </Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      );
    },
  },
] satisfies ColumnDef<UserDTO>[];
