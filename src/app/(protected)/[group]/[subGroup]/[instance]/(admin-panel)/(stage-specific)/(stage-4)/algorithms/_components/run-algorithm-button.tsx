import { toast } from "sonner";

import { type AlgorithmDTO } from "@/dto";

import { useInstanceParams } from "@/components/params-context";
import { Button } from "@/components/ui/button";

import { api } from "@/lib/trpc/client";

import { useAlgorithmUtils } from "./algorithm-context";

export function RunAlgorithmButton({ algorithm }: { algorithm: AlgorithmDTO }) {
  const params = useInstanceParams();
  const utils = useAlgorithmUtils();

  async function refetchResults(algId: string) {
    await utils.allStudentResults();
    await utils.allSupervisorResults();
    await utils.getAllSummaryResults();
    await utils.singleResult(algId);
  }

  const { isPending, mutateAsync: runAlgAsync } =
    api.institution.instance.algorithm.run.useMutation();

  async function runAlgorithm(algorithm: AlgorithmDTO) {
    void toast.promise(
      runAlgAsync({ params, algId: algorithm.id }).then(async (data) => {
        await refetchResults(algorithm.id);
        return data;
      }),
      {
        loading: "Running...",
        success: (data) =>
          `Successfully matched ${data.matched} of ${data.total} submitted students`,
        error: (err) =>
          // TODO: check that it works
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
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
