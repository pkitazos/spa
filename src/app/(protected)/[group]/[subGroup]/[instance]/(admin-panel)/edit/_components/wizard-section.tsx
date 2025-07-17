"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { spacesLabels } from "@/config/spaces";

import {
  type FlagDTO,
  type InstanceDTO,
  type TagDTO,
  type UnitOfAssessmentDTO,
} from "@/dto";

import { MarkerType } from "@/db/types";

import {
  InstanceWizard,
  type WizardFormData,
} from "@/components/instance-wizard/instance-wizard";
import { useInstanceParams } from "@/components/params-context";

import { api } from "@/lib/trpc/client";
import { formatParamsAsPath } from "@/lib/utils/general/get-instance-path";

// TODO consider how this should change in a forked instance?

export function WizardSection({
  formDetails,
}: {
  formDetails: {
    instance: InstanceDTO;
    flags: (FlagDTO & { unitsOfAssessment: UnitOfAssessmentDTO[] })[];
    tags: TagDTO[];
  };
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
      title: f.flag,
      description: f.description,
      unitsOfAssessment: f.units_of_assessment.map((u) => ({
        title: u.title,
        weight: u.weight,
        studentSubmissionDeadline: u.student_submission_deadline,
        markerSubmissionDeadline: u.marker_submission_deadline,
        allowedMarkerTypes: u.allowed_marker_types.map((t) =>
          t === "supervisor" ? MarkerType.SUPERVISOR : MarkerType.READER,
        ),
        components: u.assessment_criteria.flatMap((c, i) => ({
          title: c.title,
          description: c.description,
          weight: c.weight,
          layoutIndex: i,
        })),
        isOpen: false,
      })),
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
          flag: f.title,
          description: f.description,
          units_of_assessment: f.unitsOfAssessment.map((a) => ({
            title: a.title,
            weight: a.weight,
            student_submission_deadline: a.studentSubmissionDeadline,
            marker_submission_deadline: a.markerSubmissionDeadline,
            allowed_marker_types: a.allowedMarkerTypes.map((t) =>
              t === "SUPERVISOR" ? "supervisor" : "reader",
            ),
            assessment_criteria: a.components.map((c) => ({
              description: c.description,
              title: c.title,
              weight: c.weight,
            })),
          })),
        })),
        ...formDetails.instance,
      }}
      onSubmit={onSubmit}
      takenNames={new Set<string>()}
    />
  );
}
