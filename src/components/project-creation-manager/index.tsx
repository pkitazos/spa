"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { PAGES } from "@/config/pages";

import { type InstanceDTO, type ProjectDTO, type SupervisorDTO } from "@/dto";
import {
  formToApiTransformations,
  type ProjectFormSubmissionDTO,
  type ProjectFormInitialisationDTO,
} from "@/dto/project";

import { Role } from "@/db/types";

import {
  useInstanceParams,
  usePathInInstance,
} from "@/components/params-context";
import { Button } from "@/components/ui/button";

import { api } from "@/lib/trpc/client";

import { ProjectForm } from "../project-form";
import { useProjectForm } from "../project-form/use-project-form";

import { ProjectSelectionManager } from "./project-selection-manager";

export type ProjectSearchData = {
  instanceData: InstanceDTO;
  project: ProjectDTO;
  supervisor: SupervisorDTO;
};

interface ProjectCreationManagerProps {
  previousProjectData: {
    instanceData: InstanceDTO;
    project: ProjectDTO;
    supervisor: SupervisorDTO;
  }[];
  formInitialisationData: ProjectFormInitialisationDTO;
  userRole: typeof Role.ADMIN | typeof Role.SUPERVISOR;
  currentUserId: string;
}

export function ProjectCreationManager({
  previousProjectData,
  formInitialisationData,
  userRole,
  currentUserId,
}: ProjectCreationManagerProps) {
  const form = useProjectForm(formInitialisationData);

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
    <div className="space-y-10">
      <ProjectSelectionManager
        previousProjectData={previousProjectData}
        userRole={userRole}
        requiresConfirm={form.formState.isDirty}
        handleSelect={(data: ProjectSearchData) => form.reset(data.project)}
      />
      <ProjectForm
        form={form}
        formInitialisationData={formInitialisationData}
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
    </div>
  );
}
