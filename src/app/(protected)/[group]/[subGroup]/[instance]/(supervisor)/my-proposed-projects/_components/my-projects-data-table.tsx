"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { useInstanceParams } from "@/components/params-context";
import DataTable from "@/components/ui/data-table/data-table";

import { api } from "@/lib/trpc/client";

import {
  type SupervisorProjectDataDto,
  useMyProjectColumns,
} from "./my-projects-columns";

export function MyProjectsDataTable({
  projects,
}: {
  projects: SupervisorProjectDataDto[];
}) {
  const params = useInstanceParams();
  const router = useRouter();

  const { mutateAsync: deleteAsync } = api.project.delete.useMutation();
  const { mutateAsync: deleteSelectedAsync } =
    api.project.deleteSelected.useMutation();

  async function handleDelete(projectId: string) {
    void toast.promise(
      deleteAsync({ params: { ...params, projectId } }).then(() =>
        router.refresh(),
      ),
      {
        loading: "Deleting Project...",
        error: "Something went wrong",
        success: `Project ${projectId} deleted successfully`,
      },
    );
  }

  async function handleDeleteSelected(projectIds: string[]) {
    void toast.promise(
      deleteSelectedAsync({ params, projectIds }).then(() => router.refresh()),
      {
        loading: "Deleting Project...",
        error: "Something went wrong",
        success: `All Projects deleted successfully`,
      },
    );
  }

  const columns = useMyProjectColumns({
    deleteProject: handleDelete,
    deleteSelectedProjects: handleDeleteSelected,
  });

  return (
    <DataTable
      className="w-full"
      searchableColumn={{ id: "Project Title", displayName: "Project Titles" }}
      columns={columns}
      data={projects}
    />
  );
}
