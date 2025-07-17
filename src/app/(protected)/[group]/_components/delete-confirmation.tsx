"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { DangerZone } from "@/components/danger-zone";

import { api } from "@/lib/trpc/client";
import { type GroupParams } from "@/lib/validations/params";

export function DeleteConfirmation({
  spaceLabel,
  params,
  name,
}: {
  spaceLabel: string;
  params: GroupParams;
  name: string;
}) {
  const router = useRouter();
  const { mutateAsync: deleteAsync } =
    api.institution.deleteGroup.useMutation();

  async function destructiveAction() {
    void toast.promise(
      deleteAsync({ params }).then(() => {
        router.push(`/admin`);
        router.refresh();
      }),
      {
        loading: `Deleting ${spaceLabel}`,
        error: "Something went wrong",
        success: `Successfully deleted ${spaceLabel}`,
      },
    );
  }
  return (
    <DangerZone
      action={destructiveAction}
      spaceLabel={spaceLabel}
      name={name}
    />
  );
}
