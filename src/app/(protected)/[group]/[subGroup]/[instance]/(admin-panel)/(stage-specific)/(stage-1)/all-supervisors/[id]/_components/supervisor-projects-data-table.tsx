"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  type FlagDTO,
  ProjectAllocationStatus,
  type TagDTO,
  type ProjectDTO,
  type StudentDTO,
} from "@/dto";

import { useInstanceParams } from "@/components/params-context";
import DataTable from "@/components/ui/data-table/data-table";

import { api } from "@/lib/trpc/client";
import { toPP3 } from "@/lib/utils/general/instance-params";

import { useSupervisorProjectsColumns } from "./supervisor-projects-columns";

export function SupervisorProjectsDataTable({
  data,
  projectDescriptors,
}: {
  data: { project: ProjectDTO; allocatedStudent?: StudentDTO }[];
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
        loading: `Deleting ${projectIds.length} Projects...`,
        error: "Something went wrong",
        success: `Successfully deleted ${projectIds.length} Projects`,
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

  const columns = useSupervisorProjectsColumns({
    deleteProject: handleDelete,
    deleteSelectedProjects: handleDeleteSelected,
  });

  return (
    <DataTable
      className="w-full"
      columns={columns}
      filters={[
        ...filters,
        {
          columnId: "Student",
          title: "Allocation Status",
          options: [
            {
              id: ProjectAllocationStatus.ALGORITHMIC,
              title: "Algorithm Allocated",
            },
            {
              id: ProjectAllocationStatus.PRE_ALLOCATED,
              title: "Pre-allocated",
            },
            { id: ProjectAllocationStatus.UNALLOCATED, title: "Unallocated" },
          ],
        },
      ]}
      data={data}
    />
  );
}
