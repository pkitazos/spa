"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { useInstanceParams } from "../params-context";
import { PAGES } from "@/config/pages";

interface CreateProjectFormProps {
  formInitialisationData: ProjectFormInitialisationData;
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { mutateAsync: api_createProject } = api.project.create.useMutation();

  const handleSubmit = async (submissionData: ProjectFormSubmissionData) => {
    if (userRole === Role.ADMIN && !submissionData.supervisorId) {
      toast.error("Please select a supervisor for this project");
      return;
    }

    setIsSubmitting(true);

    try {
      const apiData = formToApiTransformations.submissionToCreateApi(
        submissionData,
        currentUserId,
      );

      await api_createProject({ params, newProject: apiData });

      toast.success("Successfully created new project");

      const redirectPath =
        userRole === Role.ADMIN ? "." : `./${PAGES.myProjects.href}`;
      router.push(redirectPath);
      router.refresh();
    } catch (error) {
      toast.error("Something went wrong while creating the project");
      console.error("Project creation error:", error);
    } finally {
      setIsSubmitting(false);
    }
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
    </ProjectForm>
  );
}
