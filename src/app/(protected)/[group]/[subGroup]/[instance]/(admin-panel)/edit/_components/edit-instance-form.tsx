"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { InstanceForm } from "@/components/instance-form";
import { Button } from "@/components/ui/button";

import { api } from "@/lib/trpc/client";
import { formatParamsAsPath } from "@/lib/utils/general/get-instance-path";
import { ValidatedInstanceDetails } from "@/lib/validations/instance-form";
import { InstanceParams } from "@/lib/validations/params";

import { spacesLabels } from "@/config/spaces";

export function EditInstanceForm({
  params,
  currentInstance,
  isForked,
}: {
  params: InstanceParams;
  currentInstance: ValidatedInstanceDetails;
  isForked: boolean;
}) {
  const router = useRouter();
  const instancePath = formatParamsAsPath(params);

  const { mutateAsync: editInstanceAsync } =
    api.institution.instance.edit.useMutation();

  async function onSubmit(data: ValidatedInstanceDetails) {
    void toast.promise(
      editInstanceAsync({
        params,
        updatedInstance: {
          ...data,
          minPreferences: data.minPreferences,
          maxPreferences: data.maxPreferences,
          maxPreferencesPerSupervisor: data.maxPreferencesPerSupervisor,
        },
      }).then(() => {
        router.push(instancePath);
        router.refresh();
      }),
      {
        loading: `Updating ${spacesLabels.instance.short} Details...`,
        error: "Something went wrong",
        success: `Successfully updated ${spacesLabels.instance.short} Details`,
      },
    );
  }

  return (
    <InstanceForm
      currentInstanceDetails={currentInstance}
      submissionButtonLabel={`Update ${spacesLabels.instance.short} Details`}
      onSubmit={onSubmit}
      isForked={isForked}
    >
      <Button type="button" size="lg" variant="outline" asChild>
        <Link href="./settings">Cancel</Link>
      </Button>
    </InstanceForm>
  );
}
