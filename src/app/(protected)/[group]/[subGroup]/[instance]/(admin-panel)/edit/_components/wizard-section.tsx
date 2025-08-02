"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { spacesLabels } from "@/config/spaces";

import { type FlagDTO, type InstanceDTO, type TagDTO } from "@/dto";

import {
  InstanceWizard,
  type WizardFormData,
} from "@/components/instance-wizard/instance-wizard";
import { useInstanceParams } from "@/components/params-context";

import { api } from "@/lib/trpc/client";
import { formatParamsAsPath } from "@/lib/utils/general/get-instance-path";

export function WizardSection({
  formDetails,
}: {
  formDetails: { instance: InstanceDTO; flags: FlagDTO[]; tags: TagDTO[] };
}) {
  const params = useInstanceParams();
  const router = useRouter();
  const instancePath = formatParamsAsPath(params);

  const { mutateAsync: editInstanceAsync } =
    api.institution.instance.edit.useMutation();

  async function onSubmit({
    flags: flagData,
    tags,
    ...instance
  }: WizardFormData) {
    const flags = flagData.map((f) => ({
      id: f.id,
      displayName: f.displayName,
      description: f.description,
    }));

    const updatedInstance = { ...params, ...instance };

    void toast.promise(
      editInstanceAsync({ params, updatedInstance, flags, tags }).then(() => {
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
    <InstanceWizard
      defaultValues={{
        tags: formDetails.tags,
        flags: formDetails.flags.map((f) => ({
          id: f.id,
          displayName: f.displayName,
          description: f.description,
        })),
        ...formDetails.instance,
      }}
      onSubmit={onSubmit}
      takenNames={new Set<string>()}
    />
  );
}
