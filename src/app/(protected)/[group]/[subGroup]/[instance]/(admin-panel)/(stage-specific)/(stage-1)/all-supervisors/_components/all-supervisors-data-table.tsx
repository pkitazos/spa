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

  const { mutateAsync: api_deleteAsync } =
    api.institution.instance.deleteSupervisor.useMutation();

  const { mutateAsync: api_deleteManyAsync } =
    api.institution.instance.deleteManySupervisors.useMutation();

  async function deleteSupervisor(supervisorId: string) {
    void toast
      .promise(api_deleteAsync({ params, supervisorId }), {
        loading: `Removing Supervisor ${supervisorId} from ${spacesLabels.instance.short}...`,
        success: `Supervisor ${supervisorId} deleted successfully`,
        error: `Failed to remove supervisor ${supervisorId} from ${spacesLabels.instance.short}`,
      })
      .unwrap()
      .then(() => {
        router.refresh();
      });
  }

  async function deleteSelectedSupervisors(supervisorIds: string[]) {
    void toast
      .promise(api_deleteManyAsync({ params, supervisorIds }), {
        loading: `Removing ${supervisorIds.length} supervisors from ${spacesLabels.instance.short}...`,
        success: `Successfully removed ${supervisorIds.length} Supervisors from ${spacesLabels.instance.short}`,
        error: `Failed to remove supervisors from ${spacesLabels.instance.short}`,
      })
      .unwrap()
      .then(() => {
        router.refresh();
      });
  }

  const columns = useAllSupervisorsColumns({
    roles,
    deleteSupervisor,
    deleteSelectedSupervisors,
  });

  return <DataTable className="w-full" columns={columns} data={data} />;
}
