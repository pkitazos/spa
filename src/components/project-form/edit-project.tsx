"use client";

import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import { api } from "@/lib/trpc/client";
import { Role } from "@/db/types";
import {
  ProjectFormInitialisationDTO,
  ProjectFormSubmissionDTO,
  formToApiTransformations,
} from "@/dto/project";

import { PageParams } from "@/lib/validations/params";
import { toPP1 } from "@/lib/utils/general/instance-params";
import { formatParamsAsPath } from "@/lib/utils/general/get-instance-path";
import { ProjectForm } from ".";
import { ProjectRemovalButton } from "./project-removal-button";

interface EditProjectFormProps {
  formInitialisationData: ProjectFormInitialisationDTO;
  userRole: typeof Role.ADMIN | typeof Role.SUPERVISOR;
  currentUserId: string;
  projectId: string;
}

export function EditProjectForm({
  formInitialisationData,
  userRole,
  currentUserId,
  projectId,
}: EditProjectFormProps) {
  const params = useParams<PageParams>();

  const router = useRouter();

  const { mutateAsync: api_editProject, isPending } =
    api.project.edit.useMutation();

  const defaultValues = formToApiTransformations.initialisationToDefaultValues(
    formInitialisationData,
  );

  const handleSubmit = async (submissionData: ProjectFormSubmissionDTO) => {
    const apiData = formToApiTransformations.submissionToEditApi(
      submissionData,
      projectId,
      currentUserId,
    );

    toast.promise(
      api_editProject({ params: toPP1(params), updatedProject: apiData })
        .then(() => {
          router.push(`${formatParamsAsPath(params)}/projects/${projectId}`);
          router.refresh();
        })
        .catch((error) => {
          console.error("Project update error:", error);
        }),
      {
        success: `Successfully updated Project ${projectId}`,
        loading: "Updating project...",
        error: "Something went wrong while updating the project",
      },
    );
  };

  const handleCancel = () => {
    router.push(`${formatParamsAsPath(params)}/projects/${projectId}`);
  };

  return (
    <ProjectForm
      formInitialisationData={formInitialisationData}
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      submissionButtonLabel="Update Project"
      userRole={userRole}
      isSubmitting={isPending}
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
      <ProjectRemovalButton
        projectId={projectId}
        isAdmin={userRole === Role.ADMIN}
      />
    </ProjectForm>
  );
}
