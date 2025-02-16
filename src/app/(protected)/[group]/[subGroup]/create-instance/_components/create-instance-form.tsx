"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { InstanceForm } from "@/components/instance-form";
import { Button } from "@/components/ui/button";

import { api } from "@/lib/trpc/client";
import { slugify } from "@/lib/utils/general/slugify";
import { ValidatedInstanceDetails } from "@/lib/validations/instance-form";
import { SubGroupParams } from "@/lib/validations/params";

import { spacesLabels } from "@/config/spaces";

export function CreateInstanceForm({
  params,
  takenNames,
}: {
  params: SubGroupParams;
  takenNames: Set<string>;
}) {
  const { group, subGroup } = params;
  const router = useRouter();

  const { mutateAsync: createInstanceAsync } =
    api.institution.subGroup.createInstance.useMutation();

  async function onSubmit(data: ValidatedInstanceDetails) {
    void toast.promise(
      createInstanceAsync({
        params,
        newInstance: {
          instanceName: data.instanceName,
          flags: data.flags,
          tags: data.tags,
          projectSubmissionDeadline: data.projectSubmissionDeadline,
          minPreferences: data.minPreferences,
          maxPreferences: data.maxPreferences,
          maxPreferencesPerSupervisor: data.maxPreferencesPerSupervisor,
          preferenceSubmissionDeadline: data.preferenceSubmissionDeadline,
        },
      }).then(() => {
        router.push(`/${group}/${subGroup}/${slugify(data.instanceName)}`);
        router.refresh();
      }),
      {
        loading: `Creating new ${spacesLabels.instance.full}...`,
        error: "Something went wrong",
        success: "Success",
      },
    );
  }

  return (
    <InstanceForm
      takenNames={takenNames}
      submissionButtonLabel={`Create new ${spacesLabels.instance.full}`}
      onSubmit={onSubmit}
    >
      <Button type="button" size="lg" variant="outline" asChild>
        <Link href={`/${group}/${subGroup}`}>Cancel</Link>
      </Button>
    </InstanceForm>
  );
}
