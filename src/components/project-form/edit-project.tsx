"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import { api } from "@/lib/trpc/client";
import { Role } from "@/db/types";
import {
  ProjectFormInitialisationData,
  ProjectFormSubmissionData,
} from "@/lib/validations/project-form";
import { formToApiTransformations } from "./transformations";

import { ProjectForm } from ".";
import { PageParams } from "@/lib/validations/params";
import { toPP1 } from "@/lib/utils/general/instance-params";
import { formatParamsAsPath } from "@/lib/utils/general/get-instance-path";
import { ProjectRemovalButton } from "@/components/project-form/project-removal-button";

interface EditProjectFormProps {
  formInitialisationData: ProjectFormInitialisationData;
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { mutateAsync: editProject } = api.project.edit.useMutation();

  const defaultValues = formToApiTransformations.initialisationToDefaultValues(
    formInitialisationData,
  );

  const handleSubmit = async (submissionData: ProjectFormSubmissionData) => {
    if (userRole === Role.ADMIN && !submissionData.supervisorId) {
      toast.error("Please select a supervisor for this project");
      return;
    }

    setIsSubmitting(true);

    try {
      const apiData = formToApiTransformations.submissionToEditApi(
        submissionData,
        projectId,
        currentUserId,
      );

      await editProject({ params: toPP1(params), updatedProject: apiData });

      toast.success(`Successfully updated Project ${projectId}`);

      router.push(`${formatParamsAsPath(params)}/projects/${projectId}`);
      router.refresh();
    } catch (error) {
      toast.error("Something went wrong while updating the project");
      console.error("Project update error:", error);
    } finally {
      setIsSubmitting(false);
    }
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
      isSubmitting={isSubmitting}
    >
      <Button
        variant="outline"
        size="lg"
        type="button"
        onClick={handleCancel}
        disabled={isSubmitting}
      >
        Cancel
      </Button>
      <ProjectRemovalButton projectId={projectId} />
    </ProjectForm>
  );
}
