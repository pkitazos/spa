"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  type FlagDTO,
  type TagDTO,
  type ProjectDTO,
  type StudentDTO,
  type SupervisorDTO,
} from "@/dto";

import { useInstanceParams } from "@/components/params-context";
import DataTable from "@/components/ui/data-table/data-table";

import { api } from "@/lib/trpc/client";
import { toPP3 } from "@/lib/utils/general/instance-params";

import { usePreAllocatedProjectColumns } from "./pre-allocated-projects-columns";

export function PreAllocatedProjectDataTable({
  data,
  projectDescriptors,
}: {
  data: {
    project: ProjectDTO;
    supervisor: SupervisorDTO;
    student: StudentDTO;
  }[];
  projectDescriptors: { flags: FlagDTO[]; tags: TagDTO[] };
}) {
  const params = useInstanceParams();
  const router = useRouter();

  const { mutateAsync: deleteAsync } = api.project.delete.useMutation();
  const { mutateAsync: deleteSelectedAsync } =
    api.project.deleteSelected.useMutation();

  async function handleDelete(projectId: string) {
    void toast.promise(
      deleteAsync({ params: toPP3(params, projectId) }).then(() =>
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

  const columns = usePreAllocatedProjectColumns({
    deleteProject: handleDelete,
    deleteSelectedProjects: handleDeleteSelected,
  });

  return <DataTable columns={columns} filters={filters} data={data} />;
}
