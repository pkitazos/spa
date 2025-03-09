"use client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { MarkingForm } from "@/components/marking-form";
import { useInstanceParams } from "@/components/params-context";

import { api } from "@/lib/trpc/client";
import { formatParamsAsPath } from "@/lib/utils/general/get-instance-path";

// TODO: fix form

export function MarkingSection({ project }: { project: TEMPMarkingFormData }) {
  const params = useInstanceParams();
  const router = useRouter();
  const instancePath = formatParamsAsPath(params);

  const { mutateAsync: editAsync } = api.user.marker.updateMarks.useMutation();

  function onSubmit(data: TEMPMarkingFormData2) {
    const submissionData: TEMPMarkingFormData = {
      flagId: project.flagId,
      studentId: project.studentId,
      submissionId: project.submissionId,
      draft: data.draft,
      finalComment: data.finalComment,
      marks: data.marks,
      recommendation: data.recommendation,
    };

    void toast.promise(
      editAsync({ params, ...submissionData }).then(() => {
        router.push(`${instancePath}/my-marking`);
        router.refresh();
      }),
      {
        loading: `Submitting marks for Student ${project.studentId}...`,
        error: "Something went wrong",
        success: `Successfully submitted marks for Student ${project.studentId}`,
      },
    );
  }

  return (
    <MarkingForm
      project={project}
      submissionButtonLabel="Submit Marks"
      onSubmit={onSubmit}
    />
  );
}

type TEMPMarkingFormData = {
  flagId: string;
  submissionId: string;
  studentId: string;
  marks: {
    assessmentCriterionId: string;
    mark: number;
    justification: string;
  }[];
  finalComment: string;
  recommendation: boolean;
  draft: boolean;
};

type TEMPMarkingFormData2 = {
  marks: {
    assessmentCriterionId: string;
    mark: number;
    justification: string;
  }[];
  finalComment: string;
  recommendation: boolean;
  draft: boolean;
};
