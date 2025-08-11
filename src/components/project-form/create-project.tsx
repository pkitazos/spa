"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { PAGES } from "@/config/pages";

import {
  type ProjectFormInitialisationDTO,
  type ProjectFormSubmissionDTO,
  type ProjectFormInternalStateDTO,
  formToApiTransformations,
} from "@/dto/project";

import { Role } from "@/db/types";

import { Button } from "@/components/ui/button";

import { api } from "@/lib/trpc/client";

import { useInstanceParams, usePathInInstance } from "../params-context";

import { ProjectForm } from ".";

interface CreateProjectFormProps {
  formInitialisationData: ProjectFormInitialisationDTO;
  userRole: typeof Role.ADMIN | typeof Role.SUPERVISOR;
  currentUserId: string;
  onBehalfOf?: string;
  defaultValues?: Partial<ProjectFormInternalStateDTO>;
  onFormDirtyChange?: (isDirty: boolean) => void;
}

export function CreateProjectForm({
  formInitialisationData,
  userRole,
  currentUserId,
  onBehalfOf,
  defaultValues,
  onFormDirtyChange,
}: CreateProjectFormProps) {
  const params = useInstanceParams();
  const router = useRouter();

  const { basePath, getPath } = usePathInInstance();

  const { mutateAsync: api_createProject, isPending } =
    api.project.create.useMutation();

  const handleSubmit = async (submissionData: ProjectFormSubmissionDTO) => {
    const apiData = formToApiTransformations.submissionToCreateApi(
      submissionData,
      currentUserId,
    );

    void toast.promise(
      api_createProject({ params, newProject: apiData })
        .then((projectId) => {
          router.push(getPath(`projects/${projectId}`));
          router.refresh();
          return projectId;
        })
        .catch((error) => {
          console.error("Project creation error:", error);
        }),
      {
        success: "Successfully created project",
        loading: "Creating Project...",
        error: "Something went wrong while creating the project",
      },
    );
  };

  const handleCancel = () => {
    const redirectPath =
      userRole === Role.ADMIN
        ? basePath
        : getPath(`${PAGES.myProposedProjects.href}`);

    router.push(redirectPath);
  };

  return (
    <ProjectForm
      formInitialisationData={formInitialisationData}
      defaultValues={defaultValues || { supervisorId: onBehalfOf }}
      onSubmit={handleSubmit}
      submissionButtonLabel="Create New Project"
      userRole={userRole}
      isSubmitting={isPending}
      onFormDirtyChange={onFormDirtyChange}
    >
      <Button
        variant="outline"
        size="lg"
        type="button"
        onClick={handleCancel}
        disabled={isPending}
      >
        Cancel
      </Button>
    </ProjectForm>
  );
}
