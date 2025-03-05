"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { useInstanceParams } from "@/components/params-context";
import DataTable from "@/components/ui/data-table/data-table";
import { Skeleton } from "@/components/ui/skeleton";

import { api } from "@/lib/trpc/client";

import { useRandomAllocationColumns } from "./random-allocation-column";

export function RandomAllocationsDataTable() {
  const params = useInstanceParams();
  const router = useRouter();

  const { mutateAsync: getRandomAllocAsync } =
    api.institution.instance.matching.getRandomAllocation.useMutation();

  const { mutateAsync: getRandomAllocForAllAsync } =
    api.institution.instance.matching.getRandomAllocationForAll.useMutation();

  const { mutateAsync: removeAllocAsync } =
    api.institution.instance.matching.removeAllocation.useMutation();

  const utils = api.useUtils();

  const refetchData = utils.user.student.getUnallocated.refetch;

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

  const { status, data } = api.user.student.getUnallocated.useQuery({ params });

  const columns = useRandomAllocationColumns({
    getRandomAllocation: handleRandomAllocation,
    getRandomAllocationForAll: handleRandomAllocationForAll,
    removeAllocation: handleRemoveAllocation,
  });

  if (status !== "success") return <Skeleton className="h-60 w-full" />;

  return (
    <DataTable
      searchableColumn={{ id: "Student Name", displayName: "Names" }}
      columns={columns}
      data={data ?? []}
    />
  );
}
