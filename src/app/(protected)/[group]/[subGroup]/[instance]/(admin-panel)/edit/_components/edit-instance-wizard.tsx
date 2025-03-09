"use client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { api } from "@/lib/trpc/client";
import { formatParamsAsPath } from "@/lib/utils/general/get-instance-path";
import { InstanceParams } from "@/lib/validations/params";

import { spacesLabels } from "@/config/spaces";
import { FlagDTO, InstanceDTO, TagDTO, UnitOfAssessmentDTO } from "@/dto";
import {
  InstanceWizard,
  WizardFormData,
} from "@/components/instance-wizard/instance-wizard";

export function EditInstanceForm({
  params,
  formDetails,
  isForked,
}: {
  params: InstanceParams;
  formDetails: {
    instanceData: InstanceDTO;
    flags: (FlagDTO & { unitsOfAssessment: UnitOfAssessmentDTO[] })[];
    tags: TagDTO[];
  };
  isForked: boolean;
}) {
  const router = useRouter();
  const instancePath = formatParamsAsPath(params);

  const { mutateAsync: editInstanceAsync } =
    api.institution.instance.edit.useMutation();

  async function onSubmit(data: WizardFormData) {
    void toast.promise(
      editInstanceAsync({ params, updatedInstance }).then(() => {
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
          flag: f.title,
          description: f.description,
          units_of_assessment: f.unitsOfAssessment.map((a) => ({
            title: a.title,
            weight: a.weight,
            student_submission_deadline: a.studentSubmissionDeadline,
            marker_submission_deadline: a.markerSubmissionDeadline,
            // TODO: re-group the same assessment criterion but different marker-types
            allowed_marker_types: [],
            assessment_criteria: a.components.map((c) => ({
              description: c.description,
              title: c.title,
              weight: c.weight,
            })),
          })),
        })),
        ...formDetails.instanceData,
      }}
      onSubmit={onSubmit}
      takenNames={new Set<string>()}
    />
  );
}
