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

  const { mutateAsync: api_deleteStudent } =
    api.institution.instance.deleteStudent.useMutation();
  const { mutateAsync: api_deleteManyStudents } =
    api.institution.instance.deleteManyStudents.useMutation();

  async function deleteStudent(studentId: string) {
    void toast
      .promise(api_deleteStudent({ params, studentId }), {
        loading: `Removing Student from this ${spacesLabels.instance.short}...`,
        success: `Student ${studentId} deleted successfully`,
        error: `Failed to remove student from ${spacesLabels.instance.short}`,
      })
      .unwrap()
      .then(() => router.refresh());
  }

  async function deleteManyStudents(studentIds: string[]) {
    void toast
      .promise(api_deleteManyStudents({ params, studentIds }), {
        loading: `Removing Students from this ${spacesLabels.instance.short}...`,
        success: `Successfully removed ${studentIds.length} students`,
        error: `Failed to remove students from ${spacesLabels.instance.short}`,
      })
      .unwrap()
      .then(() => router.refresh());
  }

  const columns = useAllStudentsColumns({
    roles,
    deleteStudent: deleteStudent,
    deleteSelectedStudents: deleteManyStudents,
  });

  const filters = [
    {
      title: "filter by Flag",
      columnId: "Flag",
      options: projectDescriptors.flags.map((flag) => ({
        id: flag.displayName,
        title: flag.displayName,
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
