"use client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { MarkingForm } from "@/components/marking-form";
import { useInstanceParams } from "@/components/params-context";

import { api } from "@/lib/trpc/client";
import { formatParamsAsPath } from "@/lib/utils/general/get-instance-path";
import { CurrentMarks, markingFormZ } from "@/lib/validations/marking-form";

export function Marking({ project }: { project: CurrentMarks }) {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const params = useInstanceParams();
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const router = useRouter();
  const instancePath = formatParamsAsPath(params);

  const { mutateAsync: editAsync } = api.project.editMarks.useMutation();

  function onSubmit(data: markingFormZ) {
    void toast.promise(
      editAsync({
        params,
        projectId: project.id,
        marks: data.marks,
        finalComment: data.finalComments,
        prize: data.prize,
        markerId: data.markerId,
        studentId: data.studentId,
        draft: true,
        flagId: "",
      }).then(() => {
        router.push(`${instancePath}/my-marking`);
        router.refresh();
      }),
      {
        loading: `Submitting marks for Project ${project.id}...`,
        error: "Something went wrong",
        success: `Successfully submitted marks for Project ${project.id}`,
      },
    );
  }

  return (
    <MarkingForm
      project={project}
      submissionButtonLabel="Submit Marks"
      onSubmit={onSubmit}
    ></MarkingForm>
  );
}
