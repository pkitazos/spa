"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { useInstanceParams } from "@/components/params-context";
import DataTable from "@/components/ui/data-table/data-table";

import { api } from "@/lib/trpc/client";

import { useRandomAllocationColumns } from "./random-allocation-column";
import { ProjectDTO, StudentDTO } from "@/dto";

export function RandomAllocationsDataTable({
  studentData,
}: {
  studentData: { student: StudentDTO; project?: ProjectDTO }[];
}) {
  const params = useInstanceParams();
  const router = useRouter();

  const { mutateAsync: getRandomAllocAsync } =
    api.institution.instance.matching.getRandomAllocation.useMutation();

  const { mutateAsync: getRandomAllocForAllAsync } =
    api.institution.instance.matching.getRandomAllocationForAll.useMutation();

  const { mutateAsync: removeAllocAsync } =
    api.institution.instance.matching.removeAllocation.useMutation();

  const utils = api.useUtils();

  function refetchData() {
    utils.institution.instance.getRandomlyAllocatedStudents.refetch({ params });
    utils.institution.instance.getUnallocatedStudents.refetch({ params });
  }

  async function handleRandomAllocation(studentId: string) {
    void toast.promise(
      getRandomAllocAsync({ params, studentId }).then(() => {
        refetchData();
        router.refresh();
      }),
      {
        loading: "Allocating Random project...",
        success: "Successfully allocated random project",
        error: "Failed to allocate project",
      },
    );
  }

  async function handleRandomAllocationForAll() {
    void toast.promise(
      getRandomAllocForAllAsync({ params }).then(() => {
        refetchData();
        router.refresh();
      }),
      {
        loading: "Allocating Random project...",
        success: "Successfully allocated random project",
        error: "Failed to allocate project",
      },
    );
  }

  async function handleRemoveAllocation(studentId: string) {
    void toast.promise(
      removeAllocAsync({ params, studentId }).then(() => {
        refetchData();
        router.refresh();
      }),
      {
        loading: "Removing project allocation...",
        success: "Successfully removed project allocation",
        error: "Failed to remove project",
      },
    );
  }

  const columns = useRandomAllocationColumns({
    getRandomAllocation: handleRandomAllocation,
    getRandomAllocationForAll: handleRandomAllocationForAll,
    removeAllocation: handleRemoveAllocation,
  });

  return (
    <DataTable
      searchableColumn={{ id: "Student Name", displayName: "Names" }}
      columns={columns}
      data={studentData}
    />
  );
}
