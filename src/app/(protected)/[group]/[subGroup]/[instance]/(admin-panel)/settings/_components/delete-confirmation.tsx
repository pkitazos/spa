"use client";

import { type ClassValue } from "clsx";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { DangerZone } from "@/components/danger-zone";
import { useInstanceParams } from "@/components/params-context";

import { api } from "@/lib/trpc/client";

export function DeleteConfirmation({
  spaceLabel,
  name,
  className,
}: {
  spaceLabel: string;
  name: string;
  className?: ClassValue;
}) {
  const params = useInstanceParams();
  const router = useRouter();

  const { group, subGroup } = params;

  const { mutateAsync: deleteAsync } =
    api.institution.subGroup.deleteInstance.useMutation();

  async function destructiveAction() {
    void toast.promise(
      deleteAsync({ params }).then(() => {
        router.push(`/${group}/${subGroup}`);
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
      className={className}
      additionalDescription={`Delete this ${spaceLabel} and all related data.`}
      action={destructiveAction}
      spaceLabel={spaceLabel}
      name={name}
    />
  );
}
