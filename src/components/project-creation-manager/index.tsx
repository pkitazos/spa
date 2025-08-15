"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { PAGES } from "@/config/pages";

import { type InstanceDTO, type ProjectDTO, type SupervisorDTO } from "@/dto";
import {
  formToApiTransformations,
  type ProjectCreationContext,
  type ProjectFormSubmissionDTO,
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

import { ProjectTemplateSelector } from "./project-template-selector";

export type ProjectSearchData = {
  instanceData: InstanceDTO;
  project: ProjectDTO;
  supervisor: SupervisorDTO;
};

interface ProjectCreationManagerProps {
  showSupervisorSelector: boolean;
  previousProjectData: ProjectSearchData[];
  projectCreationContext: ProjectCreationContext;
  userRole: typeof Role.ADMIN | typeof Role.SUPERVISOR;
  showSupervisorCol: boolean;
  currentUserId: string;
  onBehalfOf?: string;
}

export function ProjectCreationManager({
  showSupervisorSelector,
  previousProjectData,
  projectCreationContext,
  userRole,
  showSupervisorCol,
  currentUserId,
  onBehalfOf = "",
}: ProjectCreationManagerProps) {
  const { form, update } = useProjectForm(projectCreationContext, {
    supervisorId: onBehalfOf,
  });

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

    void toast
      .promise(api_createProject({ params, newProject: apiData }), {
        success: "Successfully created project",
        loading: "Creating Project...",
        error: "Something went wrong while creating the project",
      })
      .unwrap()
      .then((projectId) => {
        router.push(getPath(`${PAGES.allProjects.href}/${projectId}`));
        router.refresh();
      });
  };

  const handleCancel = () => {
    const redirectPath =
      userRole === Role.ADMIN
        ? basePath
        : getPath(PAGES.myProposedProjects.href);

    router.push(redirectPath);
  };

  return (
    <div className="space-y-10">
      <ProjectTemplateSelector
        previousProjectData={previousProjectData}
        showSupervisorCol={showSupervisorCol}
        requiresConfirm={form.formState.isDirty}
        handleSelect={({ project, instanceData }: ProjectSearchData) => {
          update(project, instanceData);
          toast.success(`Copied project into form (${project.title})`);
        }}
      />
      <ProjectForm
        form={form}
        showSupervisorSelector={showSupervisorSelector}
        projectCreationContext={projectCreationContext}
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
