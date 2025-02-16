"use client";

import { TRPCClientError } from "@trpc/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { useInstanceParams } from "@/components/params-context";
import { UserCreationErrorCard } from "@/components/toast-card/user-creation-error";
import DataTable from "@/components/ui/data-table/data-table";
import { LabelledSeparator } from "@/components/ui/labelled-separator";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

import { api } from "@/lib/trpc/client";
import { addSupervisorsCsvHeaders } from "@/lib/validations/add-users/csv";
import { NewSupervisor } from "@/lib/validations/add-users/new-user";

import { CSVUploadButton } from "./csv-upload-button";
import { FormSection } from "./form-section";
import { useNewSupervisorColumns } from "./new-supervisor-columns";

import { spacesLabels } from "@/config/spaces";

export function AddSupervisorsSection() {
  const router = useRouter();
  const params = useInstanceParams();

  const {
    data,
    isLoading,
    refetch: refetchData,
  } = api.institution.instance.getSupervisors.useQuery({
    params,
  });

  const { mutateAsync: addSupervisorAsync } =
    api.institution.instance.addSupervisor.useMutation();

  async function handleAddSupervisor(newSupervisor: NewSupervisor) {
    void toast.promise(
      addSupervisorAsync({ params, newSupervisor }).then(() => {
        router.refresh();
        refetchData();
      }),
      {
        loading: "Adding supervisor...",
        error: (err) =>
          err instanceof TRPCClientError
            ? err.message
            : `Failed to add supervisor to ${spacesLabels.instance.short}`,
        success: `Successfully added supervisor ${newSupervisor.institutionId} to ${spacesLabels.instance.short}`,
      },
    );
  }

  const { mutateAsync: addSupervisorsAsync } =
    api.institution.instance.addSupervisors.useMutation();

  async function handleAddSupervisors(newSupervisors: NewSupervisor[]) {
    const res = await addSupervisorsAsync({ params, newSupervisors }).then(
      (data) => {
        router.refresh();
        refetchData();
        return data;
      },
    );

    if (res.successFullyAdded === 0) {
      toast.error(
        `No supervisors were added to ${spacesLabels.instance.short}`,
      );
    } else {
      toast.success(
        `Successfully added ${res.successFullyAdded} supervisors to ${spacesLabels.instance.short}`,
      );
    }

    const errors = res.errors.reduce(
      (acc, val) => ({
        ...acc,
        [val.msg]: [...(acc[val.msg] ?? []), val.user.institutionId],
      }),
      {} as { [key: string]: string[] },
    );

    Object.entries(errors).forEach(([msg, affectedUsers]) => {
      toast.error(
        <UserCreationErrorCard error={msg} affectedUsers={affectedUsers} />,
      );
    });
  }

  const { mutateAsync: removeSupervisorAsync } =
    api.institution.instance.removeSupervisor.useMutation();

  async function handleSupervisorRemoval(supervisorId: string) {
    void toast.promise(
      removeSupervisorAsync({ params, supervisorId }).then(() => {
        router.refresh();
        refetchData();
      }),
      {
        loading: "Removing supervisor...",
        success: `Successfully removed supervisor ${supervisorId} from ${spacesLabels.instance.short}`,
        error: `Failed to remove supervisor from ${spacesLabels.instance.short}`,
      },
    );
  }

  const { mutateAsync: removeSupervisorsAsync } =
    api.institution.instance.removeSupervisors.useMutation();

  async function handleSupervisorsRemoval(supervisorIds: string[]) {
    void toast.promise(
      removeSupervisorsAsync({ params, supervisorIds }).then(() => {
        router.refresh();
        refetchData();
      }),
      {
        loading: "Removing supervisors...",
        success: `Successfully removed ${supervisorIds.length} supervisors from ${spacesLabels.instance.short}`,
        error: `Failed to remove supervisors from ${spacesLabels.instance.short}`,
      },
    );
  }

  const columns = useNewSupervisorColumns({
    removeSupervisor: handleSupervisorRemoval,
    removeSelectedSupervisors: handleSupervisorsRemoval,
  });
  return (
    <>
      <div className="mt-6 flex flex-col gap-6">
        <h3 className="text-xl">Upload using CSV</h3>
        <div className="flex items-center gap-6">
          <CSVUploadButton
            requiredHeaders={addSupervisorsCsvHeaders}
            handleUpload={handleAddSupervisors}
          />
          <div className="flex flex-col items-start">
            <p className="text-muted-foreground">must contain header: </p>
            <code className="text-muted-foreground">
              {addSupervisorsCsvHeaders.join(",")}
            </code>
          </div>
        </div>
      </div>
      <LabelledSeparator label="or" className="my-6" />
      <FormSection handleAddSupervisor={handleAddSupervisor} />
      <Separator className="my-14" />

      {isLoading ? (
        <Skeleton className="h-20 w-full" />
      ) : (
        <DataTable
          searchableColumn={{
            id: "Full Name",
            displayName: "Supervisor Names",
          }}
          columns={columns}
          data={data ?? []}
        />
      )}
    </>
  );
}
