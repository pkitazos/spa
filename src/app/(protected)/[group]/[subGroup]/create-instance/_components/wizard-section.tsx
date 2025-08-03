"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { spacesLabels } from "@/config/spaces";

import { type InstanceDTO } from "@/dto";

import { Stage } from "@/db/types";

import {
  InstanceWizard,
  type WizardFormData,
} from "@/components/instance-wizard/instance-wizard";

import { api } from "@/lib/trpc/client";
import { formatParamsAsPath } from "@/lib/utils/general/get-instance-path";
import { slugify } from "@/lib/utils/general/slugify";
import { type SubGroupParams } from "@/lib/validations/params";

export function WizardSection({
  takenNames,
  params,
}: {
  takenNames: Set<string>;
  params: SubGroupParams;
}) {
  const router = useRouter();

  const { mutateAsync: createInstanceAsync } =
    api.institution.subGroup.createInstance.useMutation();

  async function handleSubmit(data: WizardFormData) {
    const newInstance = {
      ...params,
      displayName: data.displayName,
      maxReaderPreferences: data.maxReaderPreferences,
      maxStudentPreferences: data.maxStudentPreferences,
      maxStudentPreferencesPerSupervisor:
        data.maxStudentPreferencesPerSupervisor,
      minReaderPreferences: data.minReaderPreferences,
      minStudentPreferences: data.minStudentPreferences,
      projectSubmissionDeadline: data.projectSubmissionDeadline,
      readerPreferenceSubmissionDeadline:
        data.readerPreferenceSubmissionDeadline,
      studentPreferenceSubmissionDeadline:
        data.studentPreferenceSubmissionDeadline,
      stage: Stage.SETUP,
      supervisorAllocationAccess: false,
      studentAllocationAccess: false,
    } satisfies Omit<InstanceDTO, "instance">;

    void toast.promise(
      createInstanceAsync({
        params,
        newInstance,
        flags: data.flags,
        tags: data.tags,
      }).then(() => {
        const newPath = formatParamsAsPath({
          group: params.group,
          subGroup: params.subGroup,
          instance: slugify(newInstance.displayName),
        });
        router.push(newPath);
      }),
      {
        loading: `Creating ${spacesLabels.instance.full}...`,
        success: `${spacesLabels.instance.full} created successfully`,
        error: `Failed to create ${spacesLabels.instance.full}`,
      },
    );
  }

  return (
    <InstanceWizard
      onSubmit={handleSubmit}
      defaultValues={{
        displayName: "",
        flags: [],
        tags: [],
        maxReaderPreferences: 0,
        maxStudentPreferences: 0,
        maxStudentPreferencesPerSupervisor: 0,
        minReaderPreferences: 0,
        minStudentPreferences: 0,
        projectSubmissionDeadline: new Date(),
        readerPreferenceSubmissionDeadline: new Date(),
        studentPreferenceSubmissionDeadline: new Date(),
      }}
      takenNames={takenNames}
    />
  );
}
