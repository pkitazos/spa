import {
  ProjectFormSubmissionData,
  ProjectFormCreateApiInput,
  ProjectFormEditApiInput,
  ProjectFormInitialisationData,
  ProjectFormInternalStateData,
} from "@/lib/validations/project-form";

export const formToApiTransformations = {
  submissionToCreateApi: (
    data: ProjectFormSubmissionData,
    currentUserId: string,
  ): ProjectFormCreateApiInput => ({
    title: data.title,
    description: data.description,
    specialTechnicalRequirements: data.specialTechnicalRequirements,

    capacityUpperBound: data.capacityUpperBound,
    preAllocatedStudentId: data.preAllocatedStudentId,

    flagIds: data.flags.map((f) => f.id),
    tagIds: data.tags.map((t) => t.id),
    supervisorId: data.supervisorId ?? currentUserId,
  }),

  submissionToEditApi: (
    data: ProjectFormSubmissionData,
    projectId: string,
    currentUserId: string,
  ): ProjectFormEditApiInput => ({
    ...formToApiTransformations.submissionToCreateApi(data, currentUserId),
    id: projectId,
  }),

  initialisationToDefaultValues: (
    initialisationData: ProjectFormInitialisationData,
  ): Partial<ProjectFormInternalStateData> | undefined => {
    const { currentProject } = initialisationData;
    if (!currentProject) return undefined;

    return {
      title: currentProject.title,
      description: currentProject.description,
      specialTechnicalRequirements: currentProject.specialTechnicalRequirements,
      supervisorId: currentProject.supervisorId,

      flags: initialisationData.flags.filter((flag) =>
        currentProject.flagIds.includes(flag.id),
      ),
      tags: initialisationData.tags.filter((tag) =>
        currentProject.tagIds.includes(tag.id),
      ),

      isPreAllocated: !!currentProject.preAllocatedStudentId,
      preAllocatedStudentId: currentProject.preAllocatedStudentId,

      capacityUpperBound: currentProject.capacityUpperBound,
    };
  },
};
