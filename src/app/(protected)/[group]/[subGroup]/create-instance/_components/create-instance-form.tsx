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
import { Stage } from "@/db/types";

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
          group,
          subGroup,
          displayName: data.displayName,
          projectSubmissionDeadline: data.projectSubmissionDeadline,
          minStudentPreferences: data.minStudentPreferences,
          maxStudentPreferences: data.maxStudentPreferences,
          maxStudentPreferencesPerSupervisor:
            data.maxStudentPreferencesPerSupervisor,
          studentPreferenceSubmissionDeadline:
            data.studentPreferenceSubmissionDeadline,
          // TODO: add fields to form
          minReaderPreferences: 0,
          maxReaderPreferences: 0,
          readerPreferenceSubmissionDeadline: new Date(),
          stage: Stage.SETUP,
          studentAllocationAccess: false,
          supervisorAllocationAccess: false,
          parentInstanceId: undefined,
          selectedAlgConfigId: undefined,
        },
        flags: data.flags,
        tags: data.tags,
      }).then(() => {
        router.push(`/${group}/${subGroup}/${slugify(data.displayName)}`);
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
