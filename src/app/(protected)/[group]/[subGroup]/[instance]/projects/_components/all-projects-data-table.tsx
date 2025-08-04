"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

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

  const { mutateAsync: api_deleteAsync } = api.project.delete.useMutation();

  const { mutateAsync: api_deleteAllAsync } =
    api.project.deleteSelected.useMutation();

  const { mutateAsync: api_changePreferenceAsync } =
    api.user.student.preference.update.useMutation();

  const { mutateAsync: api_changeSelectedPreferencesAsync } =
    api.user.student.preference.updateSelected.useMutation();

  async function handleDelete(projectId: string) {
    void toast.promise(
      api_deleteAsync({ params: toPP3(params, projectId) }).then(() =>
        router.refresh(),
      ),
      {
        loading: "Deleting project...",
        error: "Something went wrong",
        success: `Successfully deleted project ${projectId}`,
      },
    );
  }

  async function handleDeleteSelected(projectIds: string[]) {
    void toast.promise(
      api_deleteAllAsync({ params, projectIds }).then(() => router.refresh()),
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
      api_changePreferenceAsync({ params, preferenceType, projectId }).then(
        () => router.refresh(),
      ),
      {
        loading: "Updating project preference...",
        error: "Something went wrong",
        success: (
          <ToastSuccessCard
            message="Successfully updated project preference"
            action={
              <Link
                href={getPath("my-preferences")}
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "flex h-full w-max items-center gap-2 self-end py-3 text-xs",
                )}
              >
                view &quot;My Preferences&quot;
              </Link>
            }
          />
        ),
      },
    );
  }

  async function handleChangeSelectedPreferences(
    preferenceType: StudentPreferenceType,
    projectIds: string[],
  ) {
    void toast.promise(
      api_changeSelectedPreferencesAsync({
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
                href={getPath("my-preferences")}
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "flex h-full w-max items-center gap-2 self-end py-3 text-xs",
                )}
              >
                view &quot;My Preferences&quot;
              </Link>
            }
          />
        ),
      },
    );
  }

  const filters = [
    {
      columnId: "Flags",
      options: projectDescriptors.flags.map((flag) => ({
        id: flag.id,
        title: flag.displayName,
      })),
    },
    {
      columnId: "Keywords",
      options: projectDescriptors.tags.map((tag) => ({
        id: tag.id,
        title: tag.title,
      })),
    },
  ];

  const columns = useAllProjectsColumns({
    user,
    roles,
    projectPreferences,
    hasSelfDefinedProject,
    deleteProject: handleDelete,
    deleteSelectedProjects: handleDeleteSelected,
    changePreference: handleChangePreference,
    changeSelectedPreferences: handleChangeSelectedPreferences,
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
