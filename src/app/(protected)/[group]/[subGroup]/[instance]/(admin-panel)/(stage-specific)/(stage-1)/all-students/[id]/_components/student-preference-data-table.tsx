"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { useInstanceParams } from "@/components/params-context";
import DataTable from "@/components/ui/data-table/data-table";

import { api } from "@/lib/trpc/client";
import { type StudentPreferenceType } from "@/lib/validations/student-preference";

import {
  type PreferenceData,
  useStudentPreferencesColumns,
} from "./student-preference-columns";

export function StudentPreferenceDataTable({
  data,
  studentId,
}: {
  data: PreferenceData[];
  studentId: string;
}) {
  const params = useInstanceParams();
  const router = useRouter();

  const { mutateAsync: changePreferenceAsync } =
    api.user.student.preference.change.useMutation();

  const { mutateAsync: changeSelectedPreferencesAsync } =
    api.user.student.preference.changeSelected.useMutation();

  async function changePreference(
    newPreferenceType: StudentPreferenceType,
    projectId: string,
  ) {
    void toast.promise(
      changePreferenceAsync({
        params,
        newPreferenceType,
        projectId,
        studentId,
      }).then(() => router.refresh()),
      {
        loading: "Updating project preference...",
        error: "Something went wrong",
        success: `Project ${projectId} preference updated successfully`,
      },
    );
  }

  async function changeSelectedPreferences(
    newPreferenceType: StudentPreferenceType,
    projectIds: string[],
  ) {
    void toast.promise(
      changeSelectedPreferencesAsync({
        params,
        newPreferenceType,
        studentId,
        projectIds,
      }).then(() => router.refresh()),
      {
        loading: "Updating all project preferences...",
        error: "Something went wrong",
        success: `Successfully updated ${projectIds.length} project preferences`,
      },
    );
  }

  const columns = useStudentPreferencesColumns({
    changePreference,
    changeSelectedPreferences,
  });

  return (
    <DataTable
      searchableColumn={{ id: "Title", displayName: "Project Title" }}
      className="w-full"
      columns={columns}
      data={data}
    />
  );
}
