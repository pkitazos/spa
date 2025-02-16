"use client";
import { AllocationInstance } from "@prisma/client";
import { MergeIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { useInstanceParams } from "@/components/params-context";
import { Button } from "@/components/ui/button";
import {
  DestructiveAction,
  DestructiveActionCancel,
  DestructiveActionConfirm,
  DestructiveActionContent,
  DestructiveActionDescription,
  DestructiveActionHeader,
  DestructiveActionTitle,
  DestructiveActionTrigger,
  DestructiveActionVerificationTypeIn,
} from "@/components/ui/destructive-action";

import { api } from "@/lib/trpc/client";

import { spacesLabels } from "@/config/spaces";

export function MergeButton({
  forkedInstance,
  parentInstance,
}: {
  forkedInstance: AllocationInstance;
  parentInstance: AllocationInstance;
}) {
  const router = useRouter();
  const params = useInstanceParams();

  const { mutateAsync: mergeAsync } =
    api.institution.instance.merge.useMutation();

  async function handleClick() {
    void toast.promise(
      mergeAsync({ params }).then(() => {
        router.push(`/${params.group}/${params.subGroup}/${parentInstance.id}`);
        router.refresh();
      }),
      {
        loading: `Merging ${forkedInstance.displayName} into ${parentInstance.displayName}`,
        error: `Unable to merge ${spacesLabels.instance.short}s`,
        success: `Successfully merged ${forkedInstance.displayName} into ${parentInstance.displayName}`,
      },
    );
  }

  return (
    <DestructiveAction action={handleClick} requiresVerification>
      <DestructiveActionTrigger asChild>
        <Button className="flex items-center gap-2" size="lg">
          <MergeIcon className="h-4 w-4" />
          <p>Merge</p>
        </Button>
      </DestructiveActionTrigger>
      <DestructiveActionContent>
        <DestructiveActionHeader>
          <DestructiveActionTitle>Merge Instances</DestructiveActionTitle>
          <DestructiveActionDescription>
            You are about to merge {forkedInstance.displayName} into{" "}
            {parentInstance.displayName}. Please confirm by typing the name of
            this instance below:
          </DestructiveActionDescription>
        </DestructiveActionHeader>
        <DestructiveActionVerificationTypeIn
          phrase={forkedInstance.displayName}
        />
        <div className="flex w-full flex-row justify-between gap-4">
          <DestructiveActionCancel asChild>
            <Button className="w-full">Cancel</Button>
          </DestructiveActionCancel>
          <DestructiveActionConfirm asChild>
            <Button className="w-full" variant="secondary">
              Merge
            </Button>
          </DestructiveActionConfirm>
        </div>
      </DestructiveActionContent>
    </DestructiveAction>
  );
}
