"use client";

import { useInstanceParams } from "@/components/params-context";
import { StudentSavedPreferenceDataTable } from "@/components/student-saved-preferences/data-table";
import { Skeleton } from "@/components/ui/skeleton";

import { api } from "@/lib/trpc/client";

export function LatestSubmissionDataTable({
  studentId,
}: {
  studentId: string;
}) {
  const params = useInstanceParams();
  const { status, data } = api.user.student.preference.getAllSaved.useQuery({
    params,
    studentId,
  });

  if (status !== "success") return <Skeleton className="h-96" />;
  return <StudentSavedPreferenceDataTable data={data} />;
}
