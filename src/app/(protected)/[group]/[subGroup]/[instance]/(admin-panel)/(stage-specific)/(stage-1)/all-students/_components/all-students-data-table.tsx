"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { spacesLabels } from "@/config/spaces";

import { type FlagDTO, type ProjectDTO, type StudentDTO } from "@/dto";

import { type Role } from "@/db/types";

import { useInstanceParams } from "@/components/params-context";
import DataTable from "@/components/ui/data-table/data-table";

import { api } from "@/lib/trpc/client";

import { useAllStudentsColumns } from "./all-students-columns";

export function StudentsDataTable({
  roles,
  data,
  projectDescriptors,
}: {
  roles: Set<Role>;
  data: { student: StudentDTO; allocation?: ProjectDTO }[];
  projectDescriptors: { flags: FlagDTO[] };
}) {
  const params = useInstanceParams();
  const router = useRouter();

  const { mutateAsync: deleteAsync } = api.user.student.delete.useMutation();
  const { mutateAsync: deleteSelectedAsync } =
    api.user.student.deleteSelected.useMutation();

  async function handleDelete(studentId: string) {
    void toast.promise(
      deleteAsync({ params, studentId }).then(() => router.refresh()),
      {
        loading: `Removing Student from this ${spacesLabels.instance.short}...`,
        error: "Something went wrong",
        success: `Student ${studentId} deleted successfully`,
      },
    );
  }

  async function handleDeleteSelected(studentIds: string[]) {
    void toast.promise(
      deleteSelectedAsync({ params, studentIds }).then(() => router.refresh()),
      {
        loading: `Removing Students from this ${spacesLabels.instance.short}...`,
        error: "Something went wrong",
        success: `Successfully removed ${studentIds.length} students`,
      },
    );
  }

  const columns = useAllStudentsColumns({
    roles,
    deleteStudent: handleDelete,
    deleteSelectedStudents: handleDeleteSelected,
  });

  const filters = [
    {
      title: "filter by Flag",
      columnId: "Flag",
      options: projectDescriptors.flags.map((flag) => ({
        id: flag.displayName,
        displayName: flag.displayName,
      })),
    },
  ];

  return (
    <DataTable
      filters={filters}
      className="w-full"
      columns={columns}
      data={data}
    />
  );
}
