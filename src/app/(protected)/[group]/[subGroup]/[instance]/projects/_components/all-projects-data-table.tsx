"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { PAGES } from "@/config/pages";

import {
  type TagDTO,
  type FlagDTO,
  type ProjectDTO,
  type SupervisorDTO,
} from "@/dto";

import { type PreferenceType, type Role } from "@/db/types";

import {
  useInstanceParams,
  usePathInInstance,
} from "@/components/params-context";
import { ToastSuccessCard } from "@/components/toast-success-card";
import { buttonVariants } from "@/components/ui/button";
import DataTable from "@/components/ui/data-table/data-table";

import { type User } from "@/lib/auth/types";
import { api } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import { toPP3 } from "@/lib/utils/general/instance-params";
import { type StudentPreferenceType } from "@/lib/validations/student-preference";

import { useAllProjectsColumns } from "./all-projects-columns";

export function AllProjectsDataTable({
  data,
  user,
  roles,
  projectPreferences,
  hasSelfDefinedProject,
  projectDescriptors,
}: {
  data: { project: ProjectDTO; supervisor: SupervisorDTO }[];
  user: User;
  roles: Set<Role>;
  projectPreferences: Record<string, PreferenceType>;
  hasSelfDefinedProject: boolean;
  projectDescriptors: { flags: FlagDTO[]; tags: TagDTO[] };
}) {
  const params = useInstanceParams();
  const { getPath } = usePathInInstance();
  const router = useRouter();

  const { mutateAsync: api_delete } = api.project.delete.useMutation();

  const { mutateAsync: api_deleteMultiple } =
    api.project.deleteSelected.useMutation();

  const { mutateAsync: api_changePreference } =
    api.user.student.preference.update.useMutation();

  const { mutateAsync: api_changeMultiplePreferences } =
    api.user.student.preference.updateSelected.useMutation();

  async function handleDelete(projectId: string) {
    void toast.promise(
      api_delete({ params: toPP3(params, projectId) }).then(() =>
        router.refresh(),
      ),
      {
        loading: "Deleting project...",
        error: "Something went wrong",
        success: `Successfully deleted project ${projectId}`,
      },
    );
  }

  async function handleDeleteMultiple(projectIds: string[]) {
    void toast.promise(
      api_deleteMultiple({ params, projectIds }).then(() => router.refresh()),
      {
        loading: "Deleting selected projects...",
        error: "Something went wrong",
        success: `Successfully deleted ${projectIds.length} projects`,
      },
    );
  }

  async function handleChangePreference(
    preferenceType: StudentPreferenceType,
    projectId: string,
  ) {
    void toast.promise(
      api_changePreference({ params, preferenceType, projectId }).then(() =>
        router.refresh(),
      ),
      {
        loading: "Updating project preference...",
        error: "Something went wrong",
        success: (
          <ToastSuccessCard
            message="Successfully updated project preference"
            action={
              <Link
                href={getPath(PAGES.myPreferences.href)}
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "flex h-full w-34 text-nowrap items-center gap-2 self-end py-3 text-xs",
                )}
              >
                {PAGES.myPreferences.title}
              </Link>
            }
          />
        ),
      },
    );
  }

  async function handleChangeMultiplePreferences(
    preferenceType: StudentPreferenceType,
    projectIds: string[],
  ) {
    void toast.promise(
      api_changeMultiplePreferences({
        params,
        preferenceType,
        projectIds,
      }).then(() => router.refresh()),
      {
        loading: "Updating all project preferences...",
        error: "Something went wrong",
        success: (
          <ToastSuccessCard
            message={`Successfully updated ${projectIds.length} project preferences`}
            action={
              <Link
                href={getPath(PAGES.myPreferences.href)}
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "flex h-full w-max items-center gap-2 self-end py-3 text-xs",
                )}
              >
                {PAGES.myPreferences.title}
              </Link>
            }
          />
        ),
      },
    );
  }

  const filters = [
    {
      title: "Flags",
      columnId: "Flags",
      options: projectDescriptors.flags.map((flag) => ({
        id: flag.id,
        displayName: flag.displayName,
      })),
    },
    {
      title: "Keywords",
      columnId: "Keywords",
      options: projectDescriptors.tags.map((tag) => ({
        id: tag.id,
        displayName: tag.title,
      })),
    },
  ];

  const columns = useAllProjectsColumns({
    user,
    roles,
    projectPreferences,
    hasSelfDefinedProject,
    deleteProject: handleDelete,
    deleteMultipleProjects: handleDeleteMultiple,
    changePreference: handleChangePreference,
    changeMultiplePreferences: handleChangeMultiplePreferences,
  });

  return (
    <DataTable
      className="w-full"
      columns={columns}
      filters={filters}
      data={data}
    />
  );
}
