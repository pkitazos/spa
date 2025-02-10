"use client";

import { TRPCClientError } from "@trpc/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { useInstanceParams } from "@/components/params-context";
import { LabelledSeparator } from "@/components/ui/labelled-separator";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

import { api } from "@/lib/trpc/client";
import { allocateReadersCsvHeaders } from "@/lib/validations/allocate-readers/csv";
import { NewReaderAllocation } from "@/lib/validations/allocate-readers/new-reader-allocation";

import { CSVUploadButton } from "./csv-upload-button";
//import { FormSection } from "./form-section";
//import { useNewSupervisorColumns } from "./new-supervisor-columns";

import { spacesLabels } from "@/content/spaces";

export function AddReadersSection() {
  const router = useRouter();
  const params = useInstanceParams();
  const utils = api.useUtils();

  const { data, isLoading } = api.institution.instance.getSupervisors.useQuery({
    params,
  });

  const refetchData = () => utils.institution.instance.getSupervisors.refetch();

  const { mutateAsync: assignReaderAsync } =
    api.institution.instance.assignReader.useMutation();

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
    const res = await assignReadersAsync({ params, newReaderAllocations }).then(
      (data) => {
        router.refresh();
        refetchData();
        return data;
      },
    );

    if (res.successFullyAdded === 0) {
      toast.error(`No readers were assigned in ${spacesLabels.instance.short}`);
    } else {
      toast.success(
        `Successfully assigned ${res.successFullyAdded} readers to projects in ${spacesLabels.instance.short}`,
      );
    }
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
