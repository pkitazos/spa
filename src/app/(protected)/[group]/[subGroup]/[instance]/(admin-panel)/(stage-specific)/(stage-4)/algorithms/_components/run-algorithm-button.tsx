import { toast } from "sonner";

import { useInstanceParams } from "@/components/params-context";
import { Button } from "@/components/ui/button";

import { api } from "@/lib/trpc/client";
import { AlgorithmDTO } from "@/dto/algorithm";

import { useAlgorithmUtils } from "./algorithm-context";

export function RunAlgorithmButton({ algorithm }: { algorithm: AlgorithmDTO }) {
  const params = useInstanceParams();
  const utils = useAlgorithmUtils();

  function refetchResults(algId: string) {
    utils.allStudentResults();
    utils.allSupervisorResults();
    utils.getAllSummaryResults();
    utils.singleResult(algId);
  }

  const { isPending, mutateAsync: runAlgAsync } =
    api.institution.instance.algorithm.run.useMutation();

  async function runAlgorithm(algorithm: AlgorithmDTO) {
    void toast.promise(
      runAlgAsync({ params, algId: algorithm.id }).then((data) => {
        refetchResults(algorithm.id);
        return data;
      }),
      {
        loading: "Running...",
        success: (data) =>
          `Successfully matched ${data.matched} of ${data.total} submitted students`,
        error: (err) =>
          err.message === "Infeasible"
            ? "Matching is infeasible with current configuration"
            : `Something went wrong`,
      },
    );
  }

  return (
    <Button onClick={() => runAlgorithm(algorithm)} disabled={isPending}>
      run
    </Button>
  );
}
