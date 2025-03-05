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
import { toPP3 } from "@/lib/utils/general/instance-params";

export function SpecialCircumstancesPage({
  formInternalData,
  project,
}: {
  formInternalData: specialCircumstances;
  project: CurrentSpecialCircumstances;
}) {
  const params = useInstanceParams();
  const router = useRouter();
  const instancePath = formatParamsAsPath(params);

  const { mutateAsync: editAsync } = api.project.edit.useMutation();

  function onSubmit(data: specialCircumstances) {
    const updatedProject = { id: project.id, ...data };

    void toast.promise(
      editAsync({ params: toPP3(params, project.id), updatedProject }).then(
        () => {
          router.push(`${instancePath}/projects/${project.id}`);
          router.refresh();
        },
      ),
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
