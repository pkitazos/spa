"use client";
import { Role } from "@prisma/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { useInstanceParams } from "@/components/params-context";
import DataTable from "@/components/ui/data-table/data-table";

import { api } from "@/lib/trpc/client";
import { SupervisorDto } from "@/lib/validations/dto/supervisor";

import { useAllSupervisorsColumns } from "./all-supervisors-columns";

import { spacesLabels } from "@/content/spaces";

export function SupervisorsDataTable({
  role,
  data,
}: {
  role: Role;
  data: SupervisorDto[];
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
    role: role,
    deleteSupervisor: handleDelete,
    deleteSelectedSupervisors: handleDeleteSelected,
  });

  return (
    <DataTable
      searchableColumn={{ id: "Name", displayName: "Supervisor Names" }}
      className="w-full"
      columns={columns}
      data={data}
    />
  );
}
