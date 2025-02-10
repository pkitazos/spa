"use client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { useInstanceParams } from "@/components/params-context";
import { SpecialCircumstancesForm } from "@/components/special-circumstances-form";

import { api } from "@/lib/trpc/client";
import { formatParamsAsPath } from "@/lib/utils/general/get-instance-path";
import {
  CurrentSpecialCircumstances,
  specialCircumstances,
} from "@/lib/validations/special-circumstances-form";

export function SpecialCircumstancesPage({
  formInternalData,
  project,
  studentId,
}: {
  formInternalData: specialCircumstances;
  project: CurrentSpecialCircumstances;
  studentId: string;
}) {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const params = useInstanceParams();
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const router = useRouter();
  const instancePath = formatParamsAsPath(params);

  const { mutateAsync: editAsync } =
    api.project.editSpecialCircumstances.useMutation();

  function onSubmit(data: specialCircumstances) {
    void toast.promise(
      editAsync({
        params,
        projectId: project.id,
        studentId,
        specialCircumstances: data.specialCircumstances,
      }).then(() => {
        router.push(`${instancePath}/projects/${project.id}`);
        router.refresh();
      }),
      {
        loading: `Updating special circumstances for Project ${project.id}...`,
        error: "Something went wrong",
        success: `Successfully updated special circumstances for Project ${project.id}`,
      },
    );
  }

  return (
    <SpecialCircumstancesForm
      specialCircumstances={formInternalData}
      project={project}
      submissionButtonLabel="Update Special Circumstances"
      onSubmit={onSubmit}
    />
  );
}
