import { useForm, type UseFormReturn } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";

import {
  formToApiTransformations,
  projectForm,
  type ProjectFormInternalStateDTO,
  type ProjectFormInitialisationDTO,
} from "@/dto";

export function useProjectForm(
  formInitialisationData: ProjectFormInitialisationDTO,
): UseFormReturn<ProjectFormInternalStateDTO> {
  const { flags, takenTitles } = formInitialisationData;
  const defaultValues = formToApiTransformations.initialisationToDefaultValues(
    formInitialisationData,
  );

  //   @ts-expect-error lib busted TODO
  return useForm({
    resolver: zodResolver(projectForm.buildInternalStateSchema(takenTitles)),
    defaultValues: {
      title: "",
      description: "",
      flags,
      tags: [],
      capacityUpperBound: 1,
      isPreAllocated: false,
      preAllocatedStudentId: "",
      supervisorId: "",
      ...defaultValues,
    },
  });
}
