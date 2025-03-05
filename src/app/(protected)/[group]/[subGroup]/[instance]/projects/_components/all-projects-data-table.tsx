"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  useInstanceParams,
  useInstancePath,
} from "@/components/params-context";
import { ToastSuccessCard } from "@/components/toast-success-card";
import { buttonVariants } from "@/components/ui/button";
import DataTable from "@/components/ui/data-table/data-table";
import { useDataTableProjectFilters } from "@/components/ui/data-table/data-table-context";

import { api } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import { User } from "@/lib/validations/auth";
import { ProjectTableDataDto } from "@/lib/validations/dto/project";
import { StudentPreferenceType } from "@/lib/validations/student-preference";

import { useAllProjectsColumns } from "./all-projects-columns";

import { PreferenceType, Role } from "@/db/types";
import { toPP3 } from "@/lib/utils/general/instance-params";

export function AllProjectsDataTable({
  data,
  user,
  roles,
  projectPreferences,
  hasSelfDefinedProject,
}: {
  data: ProjectTableDataDto[];
  user: User;
  roles: Set<Role>;
  projectPreferences: Record<string, PreferenceType>;
  hasSelfDefinedProject: boolean;
}) {
  const params = useInstanceParams();
  const instancePath = useInstancePath();
  const router = useRouter();

  const { mutateAsync: deleteAsync } = api.project.delete.useMutation();
  const { mutateAsync: deleteAllAsync } =
    api.project.deleteSelected.useMutation();

  async function handleDelete(projectId: string) {
    void toast.promise(
      deleteAsync({ params: toPP3(params, projectId) }).then(() =>
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
      deleteAllAsync({ params, projectIds }).then(() => router.refresh()),
      {
        loading: "Deleting selected projects...",
        error: "Something went wrong",
        success: `Successfully deleted ${projectIds.length} projects`,
      },
    );
  }

  const { mutateAsync: changePreferenceAsync } =
    api.user.student.preference.update.useMutation();

  const { mutateAsync: changeSelectedPreferencesAsync } =
    api.user.student.preference.updateSelected.useMutation();

  async function handleChangePreference(
    preferenceType: StudentPreferenceType,
    projectId: string,
  ) {
    void toast.promise(
      changePreferenceAsync({ params, preferenceType, projectId }).then(() =>
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
                href={`${instancePath}/my-preferences`}
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
      changeSelectedPreferencesAsync({
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
                href={`${instancePath}/my-preferences`}
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

  const filters = useDataTableProjectFilters();

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
      searchableColumn={{ id: "Title", displayName: "Project Titles" }}
      className="w-full"
      columns={columns}
      filters={filters}
      data={data}
    />
  );
}
