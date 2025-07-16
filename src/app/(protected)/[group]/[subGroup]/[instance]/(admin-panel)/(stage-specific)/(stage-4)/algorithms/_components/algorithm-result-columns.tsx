import { type Dispatch, type SetStateAction } from "react";

import { type ColumnDef } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { type AlgorithmResultDTO } from "@/dto";

import { useInstanceParams } from "@/components/params-context";
import { Button } from "@/components/ui/button";
import {
  DestructiveAction,
  DestructiveActionCancel,
  DestructiveActionConfirm,
  DestructiveActionContent,
  DestructiveActionDescription,
  DestructiveActionHeader,
  DestructiveActionTitle,
  DestructiveActionTrigger,
  DestructiveActionVerificationTypeIn,
} from "@/components/ui/destructive-action";

import { api } from "@/lib/trpc/client";
import {
  formatProfile,
  formatSize,
  formatWeight,
} from "@/lib/utils/algorithm/format";

import { useAlgorithmUtils } from "./algorithm-context";

export function useAlgorithmResultColumns({
  selectedAlgName,
  setSelectedAlgName,
}: {
  selectedAlgName: string | undefined;
  setSelectedAlgName: Dispatch<SetStateAction<string | undefined>>;
}): ColumnDef<AlgorithmResultDTO>[] {
  const params = useInstanceParams();
  const router = useRouter();

  const utils = useAlgorithmUtils();

  async function refetchResults() {
    await utils.getAll();
    await utils.allStudentResults();
    await utils.allSupervisorResults();
    await utils.getAllSummaryResults();
  }

  const { mutateAsync: selectMatchingAsync } =
    api.institution.instance.matching.select.useMutation();

  function handleSelection(algId: string) {
    void toast.promise(
      selectMatchingAsync({ algId, params }).then(async () => {
        setSelectedAlgName(algId);
        await refetchResults();
        router.refresh();
      }),
      {
        loading: "Changing selection...",
        error: "Something went wrong",
        success: "Successfully updated selection",
      },
    );
  }

  const columns: ColumnDef<AlgorithmResultDTO>[] = [
    { id: "Name", accessorFn: (a) => a.algorithm.displayName, header: "Name" },
    {
      id: "Weight",
      accessorFn: (a) => a.matchingResults.weight,
      header: () => <p className="w-12 text-center">Weight</p>,
      cell: ({
        row: {
          original: { matchingResults },
        },
      }) => (
        <p className="w-12 text-center">
          {formatWeight(matchingResults.weight)}
        </p>
      ),
    },
    {
      id: "Size",
      accessorFn: (a) => a.matchingResults.size,
      header: () => <p className="w-12 text-center">Size</p>,
      cell: ({
        row: {
          original: { matchingResults },
        },
      }) => (
        <p className="w-12 text-center">{formatSize(matchingResults.size)}</p>
      ),
    },
    {
      id: "Profile",
      accessorFn: (a) => a.matchingResults.profile,
      header: () => <p className="w-28 text-center">Profile</p>,
      cell: ({
        row: {
          original: { matchingResults },
        },
      }) => (
        <p className="w-28 text-center">
          {formatProfile(matchingResults.profile)}
        </p>
      ),
    },
    {
      id: "selection",
      header: () => null,
      cell: ({
        row: {
          original: { algorithm, matchingResults },
        },
      }) => (
        <DestructiveAction
          action={() => handleSelection(algorithm.id)}
          // TODO: don't allow selection of algName if it's already selected
          requiresVerification
        >
          <DestructiveActionTrigger asChild>
            <Button
              className="w-24"
              variant={selectedAlgName === algorithm.id ? "secondary" : "ghost"}
              disabled={matchingResults.profile.length === 0}
            >
              {selectedAlgName === algorithm.id ? "Selected" : "Select"}
            </Button>
          </DestructiveActionTrigger>
          <DestructiveActionContent>
            <DestructiveActionHeader>
              <DestructiveActionTitle>Select Matching</DestructiveActionTitle>
              <DestructiveActionDescription className="text-justify tracking-tight">
                You are about to select the matching produced by algorithm
                &quot;{algorithm.displayName}&quot;. This will override any
                previous selection, and remove the students matched by this
                algorithm from the pool of available students to run further
                matching algorithms against. Please confirm by typing the name
                of this algorithm below:
              </DestructiveActionDescription>
            </DestructiveActionHeader>
            <DestructiveActionVerificationTypeIn
              phrase={algorithm.displayName}
            />
            <div className="flex w-full flex-row justify-between gap-4">
              <DestructiveActionCancel asChild>
                <Button className="w-full">Cancel</Button>
              </DestructiveActionCancel>
              <DestructiveActionConfirm asChild>
                <Button className="w-full" variant="secondary">
                  Select
                </Button>
              </DestructiveActionConfirm>
            </div>
          </DestructiveActionContent>
        </DestructiveAction>
      ),
    },
  ];

  return columns;
}
