"use client";

import { useInstanceParams } from "@/components/params-context";
import DataTable from "@/components/ui/data-table/data-table";
import { Skeleton } from "@/components/ui/skeleton";

import { api } from "@/lib/trpc/client";

import { useSelectedAlgorithm } from "./algorithm-context";
import { useAlgorithmResultColumns } from "./algorithm-result-columns";

export function AlgorithmResultDataTable() {
  const params = useInstanceParams();
  const { selectedAlgName, setSelectedAlgName } = useSelectedAlgorithm();

  const { status, data } =
    api.institution.instance.algorithm.getAllSummaryResults.useQuery({
      params,
    });

  const columns = useAlgorithmResultColumns({
    selectedAlgName,
    setSelectedAlgName,
  });

  if (status !== "success") return <Skeleton className="h-60 w-full" />;

  return (
    <DataTable searchParamPrefix="summary" columns={columns} data={data} />
  );
}
