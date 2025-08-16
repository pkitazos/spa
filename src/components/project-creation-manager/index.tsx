"use client";

import { useState } from "react";

import { CopyPlusIcon, LayoutTemplateIcon } from "lucide-react";
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
import { ProjectForm, useProjectForm } from "@/components/project-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { api } from "@/lib/trpc/client";

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
      <TemplateSection
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

export function TemplateSection({
  previousProjectData,
  showSupervisorCol,
  requiresConfirm,
  handleSelect,
}: {
  previousProjectData: ProjectSearchData[];
  showSupervisorCol: boolean;
  requiresConfirm: boolean;
  handleSelect: (data: ProjectSearchData) => void;
}) {
  const [open, setOpen] = useState<boolean | undefined>(undefined);
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mt-6 mb-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 rounded-md">
            <LayoutTemplateIcon className="h-4 w-4 text-indigo-600" />
          </div>
          <div>
            <h3 className="font-medium">Start from template</h3>
            <p className="text-sm text-muted-foreground">
              Use a previous project as your starting point
            </p>
          </div>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <CopyPlusIcon className="h-4 w-4 mr-2" />
              Browse Previous Projects
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-5xl">
            <DialogHeader className="mx-2">
              <DialogTitle>Previous Projects</DialogTitle>
              <DialogDescription>
                Select a previous project to use as a template.
              </DialogDescription>
            </DialogHeader>
            <ProjectTemplateSelector
              previousProjectData={previousProjectData}
              showSupervisorCol={showSupervisorCol}
              requiresConfirm={requiresConfirm}
              handleSelect={(data) => {
                setOpen(false);
                handleSelect(data);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
