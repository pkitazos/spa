"use client";
import { api } from "@/lib/trpc/client";
import {
  InstanceWizard,
  WizardFormData,
} from "@/components/instance-wizard/instance-wizard";
import { toast } from "sonner";
import { spacesLabels } from "@/config/spaces";
import { SubGroupParams } from "@/lib/validations/params";
import { MarkerType, New, Stage } from "@/db/types";
import { FlagDTO, InstanceDTO, NewUnitOfAssessmentDTO, TagDTO } from "@/dto";
import { useRouter } from "next/navigation";
import { slugify } from "@/lib/utils/general/slugify";

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

    const flags = data.flags.map((f) => ({
      title: f.flag,
      description: f.description,
      unitsOfAssessment: f.units_of_assessment.map((a) => ({
        title: a.title,
        weight: a.weight,
        studentSubmissionDeadline: a.student_submission_deadline,
        markerSubmissionDeadline: a.marker_submission_deadline,
        isOpen: false,
        allowedMarkerTypes: a.allowed_marker_types.map((t) =>
          t === "supervisor" ? MarkerType.SUPERVISOR : MarkerType.READER,
        ),
        components: a.assessment_criteria.flatMap((x, i) => ({
          description: x.description,
          title: x.title,
          weight: x.weight,
          layoutIndex: i + 1,
        })),
      })),
    })) satisfies (New<FlagDTO> & {
      unitsOfAssessment: NewUnitOfAssessmentDTO[];
    })[];

    const tags = data.tags satisfies New<TagDTO>[];

    void toast.promise(
      createInstanceAsync({ params, newInstance, flags, tags }).then(() =>
        router.push(`./${params.subGroup}/${slugify(newInstance.displayName)}`),
      ),
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
