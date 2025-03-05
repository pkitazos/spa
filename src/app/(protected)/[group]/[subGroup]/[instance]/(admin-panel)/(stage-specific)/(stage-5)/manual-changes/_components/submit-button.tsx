"use client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { useInstanceParams } from "@/components/params-context";
import { Button } from "@/components/ui/button";

import { api } from "@/lib/trpc/client";
import { allProjectsValid } from "@/lib/utils/allocation-adjustment";
import { allSupervisorsValid } from "@/lib/utils/allocation-adjustment/supervisor";

import { useAllocDetails } from "./allocation-store";

export function SubmitButton() {
  const router = useRouter();

  const params = useInstanceParams();
  const allProjects = useAllocDetails((s) => s.projects);
  const allStudents = useAllocDetails((s) => s.students);
  const allSupervisors = useAllocDetails((s) => s.supervisors);
  const setSelectedStudentIds = useAllocDetails((s) => s.setSelectedStudentIds);
  const updateStudents = useAllocDetails((s) => s.updateStudents);
  const updateProjects = useAllocDetails((s) => s.updateProjects);

  const valid =
    allProjectsValid(allProjects) &&
    allSupervisorsValid(allProjects, allSupervisors);

  const { mutateAsync } =
    api.institution.instance.matching.updateAllocation.useMutation();

  const utils = api.useUtils();

  async function fetchUpdatedRowData() {
    return await utils.institution.instance.matching.rowData.fetch({ params });
  }

  async function updateInternalState() {
    const { students, projects } = await fetchUpdatedRowData();
    updateStudents(students);
    updateProjects(projects);
  }

  async function handleSubmission() {
    setSelectedStudentIds([]);
    void toast.promise(
      mutateAsync({ params, allProjects, allStudents })
        .then(updateInternalState)
        .then(() => router.refresh()),
      {
        loading: "Updating project allocations",
        error: "Something went wrong",
        success: "Successfully updated project allocations",
      },
    );
  }

  return (
    <Button disabled={!valid} onClick={handleSubmission}>
      Submit Changes
    </Button>
  );
}
