"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { InstanceForm } from "@/components/instance-form";
import { Button } from "@/components/ui/button";

import { api } from "@/lib/trpc/client";
import { formatParamsAsPath } from "@/lib/utils/general/get-instance-path";
import { InstanceParams } from "@/lib/validations/params";

import { spacesLabels } from "@/config/spaces";
import { FlagDTO, InstanceDTO, TagDTO } from "@/dto";
import { z } from "zod";

const baseSchema = z.object({
  displayName: z.string().min(1, "Please enter a name"),
  minStudentPreferences: z.number(),
  maxStudentPreferences: z.number(),
  maxStudentPreferencesPerSupervisor: z.number(),
  studentPreferenceSubmissionDeadline: z.date(),
  minReaderPreferences: z.number(),
  maxReaderPreferences: z.number(),
  readerPreferenceSubmissionDeadline: z.date(),
  projectSubmissionDeadline: z.date(),
  flags: z.array(
    z.object({
      title: z.string().min(3, "Please enter a valid title"),
      description: z.string().min(3, "Please enter a valid description"),
    }),
  ),
  tags: z.array(
    z.object({ title: z.string().min(2, "Please enter a valid title") }),
  ),
});

export type ValidatedInstanceDetails = z.infer<typeof baseSchema>;

export function EditInstanceForm({
  params,
  formDetails,
  isForked,
}: {
  params: InstanceParams;
  formDetails: { instanceData: InstanceDTO; flags: FlagDTO[]; tags: TagDTO[] };
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
          minStudentPreferences: data.minStudentPreferences,
          maxStudentPreferences: data.maxStudentPreferences,
          maxStudentPreferencesPerSupervisor:
            data.maxStudentPreferencesPerSupervisor,
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
      formDetails={formDetails}
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
