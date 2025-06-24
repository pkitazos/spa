"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import { api } from "@/lib/trpc/client";
import { Role } from "@/db/types";
import {
  ProjectFormInitialisationDTO,
  ProjectFormSubmissionDTO,
  formToApiTransformations,
} from "@/dto/project";

import { ProjectForm } from ".";
import { useInstanceParams } from "../params-context";
import { PAGES } from "@/config/pages";
import { formatParamsAsPath } from "@/lib/utils/general/get-instance-path";

interface CreateProjectFormProps {
  formInitialisationData: ProjectFormInitialisationDTO;
  userRole: typeof Role.ADMIN | typeof Role.SUPERVISOR;
  currentUserId: string;
  onBehalfOf?: string;
}

export function CreateProjectForm({
  formInitialisationData,
  userRole,
  currentUserId,
  onBehalfOf,
}: CreateProjectFormProps) {
  const params = useInstanceParams();
  const router = useRouter();

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
          router.push(`${formatParamsAsPath(params)}/projects/${projectId}`);
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
      userRole === Role.ADMIN ? "." : `./${PAGES.myProjects.href}`;
    router.push(redirectPath);
  };

  return (
    <ProjectForm
      formInitialisationData={formInitialisationData}
      defaultValues={{ supervisorId: onBehalfOf }}
      onSubmit={handleSubmit}
      submissionButtonLabel="Create New Project"
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
    </ProjectForm>
  );
}
