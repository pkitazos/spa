"use client";

import { useRouter } from "next/navigation";

import { type ReaderAssignmentResult } from "@/dto/result/reader-allocation-result";

import { useInstanceParams } from "@/components/params-context";

import { api } from "@/lib/trpc/client";
import { allocateReadersCsvHeaders } from "@/lib/validations/allocate-readers/csv";
import { type NewReaderAllocation } from "@/lib/validations/allocate-readers/new-reader-allocation";

import { CSVUploadButton } from "./csv-upload-button";

export function AddReadersSection() {
  const router = useRouter();
  const params = useInstanceParams();
  const utils = api.useUtils();

  // const { data, isLoading } = api.institution.instance.getSupervisors.useQuery({
  //   params,
  // });

  const refetchData = () => utils.institution.instance.getSupervisors.refetch();

  /*async function handleAssignReader(newReaderAllocation: NewReaderAllocation) {
    void toast.promise(
      assignReadersAsync({ params, newReaderAllocation }).then(() => {
        router.refresh();
        refetchData();
      }),
      {
        loading: "Assigning reader...",
        error: (err) =>
          err instanceof TRPCClientError
            ? err.message
            : `Failed to add reader to ${newReaderAllocation.project_title}`,
        success: `Successfully assigned reader ${newReaderAllocation.reader_name} to ${newReaderAllocation.project_title}`,
      },
    );
  }*/

  const { mutateAsync: assignReadersAsync } =
    api.institution.instance.assignReaders.useMutation();

  async function handleAssignReaders(
    newReaderAllocations: NewReaderAllocation[],
  ) {
    const _res = await assignReadersAsync({
      params,
      newReaderAllocations,
    }).then(async (data) => {
      router.refresh();
      await refetchData();

      return data.reduce(
        (acc, val) => ({ ...acc, [val]: (acc[val] ?? 0) + 1 }),
        {} as Record<ReaderAssignmentResult, number>,
      );
    });

    // TODO: report status of csv upload

    // if (res.successFullyAdded === 0) {
    //   toast.error(`No readers were assigned in ${spacesLabels.instance.short}`);
    // } else {
    //   toast.success(
    //     `Successfully assigned ${res.successFullyAdded} readers to projects in ${spacesLabels.instance.short}`,
    //   );
    // }
  }

  return (
    <>
      <div className="mt-6 flex flex-col gap-6">
        <h3 className="text-xl">Upload using CSV</h3>
        <div className="flex items-center gap-6">
          <CSVUploadButton
            requiredHeaders={allocateReadersCsvHeaders}
            handleUpload={handleAssignReaders}
          />
          <div className="flex flex-col items-start">
            <p className="text-muted-foreground">must contain header: </p>
            <code className="text-muted-foreground">
              {allocateReadersCsvHeaders.join(",")}
            </code>
          </div>
        </div>
      </div>
    </>
  );
}
