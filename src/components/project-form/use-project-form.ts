import { useCallback } from "react";
import { useForm, type UseFormReturn } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";

import {
  projectForm,
  type ProjectFormInternalStateDTO,
  type ProjectCreationContext,
  type ProjectDTO,
  type InstanceDTO,
} from "@/dto";

import { isSameInstance } from "@/lib/utils/general/instance-params";

import { useInstanceParams } from "../params-context";

export function useProjectForm(
  ctx: ProjectCreationContext,
  initialData?: Partial<ProjectDTO>,
): {
  form: UseFormReturn<ProjectFormInternalStateDTO>;
  update: (project: ProjectDTO, instanceData: InstanceDTO) => void;
} {
  const params = useInstanceParams();

  const form = useForm({
    resolver: zodResolver(
      projectForm.buildInternalStateSchema(ctx.takenTitles),
    ),
    defaultValues: {
      title: initialData?.title ?? "",
      description: initialData?.description ?? "",
      flags: initialData?.flags ?? ctx.flags,
      tags: initialData?.tags ?? [],
      capacityUpperBound: initialData?.capacityUpperBound ?? 1,
      isPreAllocated: !!(initialData?.preAllocatedStudentId ?? ""),
      preAllocatedStudentId: initialData?.preAllocatedStudentId ?? "",
      supervisorId: initialData?.supervisorId ?? "",
    },
  }) as UseFormReturn<ProjectFormInternalStateDTO>;

  const update = useCallback(
    (
      {
        title,
        description,
        tags,
        flags: projectFlags,
        supervisorId,
      }: ProjectDTO,
      instanceData: InstanceDTO,
    ) => {
      if (isSameInstance(params, instanceData)) {
        form.reset({
          title,
          description,
          tags,
          flags: projectFlags,
          supervisorId,
        });
      } else {
        form.reset({
          title,
          description,
          tags: [],
          flags: ctx.flags,
          supervisorId,
        });
      }
    },
    [ctx, form, params],
  );

  return { form, update };
}
