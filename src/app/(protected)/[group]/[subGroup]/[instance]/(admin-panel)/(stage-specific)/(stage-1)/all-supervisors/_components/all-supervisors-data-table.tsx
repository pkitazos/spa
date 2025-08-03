"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { spacesLabels } from "@/config/spaces";

import { type SupervisorDTO } from "@/dto";

import { type Role } from "@/db/types";

import { useInstanceParams } from "@/components/params-context";
import DataTable from "@/components/ui/data-table/data-table";

import { api } from "@/lib/trpc/client";

import { useAllSupervisorsColumns } from "./all-supervisors-columns";

export function SupervisorsDataTable({
  roles,
  data,
}: {
  roles: Set<Role>;
  data: SupervisorDTO[];
}) {
  const params = useInstanceParams();
  const router = useRouter();

  const { mutateAsync: deleteAsync } = api.user.supervisor.delete.useMutation();
  const { mutateAsync: deleteSelectedAsync } =
    api.user.supervisor.deleteMany.useMutation();

  async function handleDelete(supervisorId: string) {
    void toast.promise(
      deleteAsync({ params, supervisorId }).then(() => router.refresh()),
      {
        loading: `Removing Supervisor ${supervisorId} from ${spacesLabels.instance.short}...`,
        error: "Something went wrong",
        success: `Supervisor ${supervisorId} deleted successfully`,
      },
    );
  }

  async function handleDeleteSelected(supervisorIds: string[]) {
    void toast.promise(
      deleteSelectedAsync({ params, supervisorIds }).then(() =>
        router.refresh(),
      ),
      {
        loading: `Removing ${supervisorIds.length} supervisors from ${spacesLabels.instance.short}...`,
        error: "Something went wrong",
        success: `Successfully removed ${supervisorIds.length} Supervisors from ${spacesLabels.instance.short}`,
      },
    );
  }

  const columns = useAllSupervisorsColumns({
    roles,
    deleteSupervisor: handleDelete,
    deleteSelectedSupervisors: handleDeleteSelected,
  });

  return (
    <DataTable
      className="w-full"
      columns={columns}
      data={data}
    />
  );
}
