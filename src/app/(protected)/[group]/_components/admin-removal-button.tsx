"use client";

import { Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { spacesLabels } from "@/config/spaces";

import { Button } from "@/components/ui/button";
import { YesNoAction } from "@/components/yes-no-action";

import { api } from "@/lib/trpc/client";
import { type GroupParams } from "@/lib/validations/params";

export function AdminRemovalButton({
  params,
  userId,
}: {
  params: GroupParams;
  userId: string;
}) {
  const router = useRouter();

  const { mutateAsync } = api.institution.group.removeAdmin.useMutation();

  function handleRemoval() {
    void toast.promise(
      mutateAsync({ params, userId }).then(() => router.refresh()),
      {
        loading: `Removing ${spacesLabels.group.short} admin...`,
        error: "Something went wrong",
        success: `Successfully removed ${spacesLabels.group.short} admin`,
      },
    );
  }

  return (
    <YesNoAction
      action={handleRemoval}
      title={`Remove ${spacesLabels.group.short} Admin?`}
      description={`You are about to remove a ${spacesLabels.group.short} admin. Do you wish to proceed?`}
      trigger={
        <Button variant="destructive" className="flex items-center gap-2">
          <Trash2Icon className="h-4 w-4" />
          <p>remove</p>
        </Button>
      }
    />
  );
}
