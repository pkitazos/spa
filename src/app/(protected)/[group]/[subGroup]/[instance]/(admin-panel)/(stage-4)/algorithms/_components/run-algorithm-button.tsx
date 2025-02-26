import { toast } from "sonner";

import { useInstanceParams } from "@/components/params-context";
import { Button } from "@/components/ui/button";

import { api } from "@/lib/trpc/client";
import { AlgorithmDTO } from "@/lib/validations/algorithm";

import { useAlgorithmUtils } from "./algorithm-context";

export function RunAlgorithmButton({ algorithm }: { algorithm: AlgorithmDTO }) {
  const params = useInstanceParams();
  const utils = useAlgorithmUtils();

  function refetchResults(algName: string) {
    utils.allStudentResults();
    utils.allSupervisorResults();
    utils.getAllSummaryResults();
    utils.singleResult(algName);
  }

  const { isPending, mutateAsync: runAlgAsync } =
    api.institution.instance.algorithm.run.useMutation();

  async function runAlgorithm(a: AlgorithmDTO) {
    const algorithm = {
      ...a,
      flag1: a.flags.at(0)!,
      flag2: a.flags.at(1) ?? null,
      flag3: a.flags.at(2) ?? null,
    };

    void toast.promise(
      runAlgAsync({ params, algorithm }).then((data) => {
        refetchResults(a.name);
        return data;
      }),
      {
        loading: "Running...",
        success: (data) =>
          `Successfully matched ${data.matchedStudents} of ${data.totalStudents} submitted students`,
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
