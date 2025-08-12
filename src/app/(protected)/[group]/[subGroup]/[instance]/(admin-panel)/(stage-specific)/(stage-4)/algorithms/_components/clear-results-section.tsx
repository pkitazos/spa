"use client";

import { BookmarkXIcon, DatabaseZapIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { useInstanceParams } from "@/components/params-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DestructiveAction,
  DestructiveActionCancel,
  DestructiveActionConfirm,
  DestructiveActionContent,
  DestructiveActionDescription,
  DestructiveActionFooter,
  DestructiveActionHeader,
  DestructiveActionTitle,
  DestructiveActionTrigger,
  DestructiveActionVerificationTypeIn,
} from "@/components/ui/destructive-action";
import { Label } from "@/components/ui/label";
import { Table, TableCell, TableRow } from "@/components/ui/table";
import { YesNoAction } from "@/components/yes-no-action";

import { api } from "@/lib/trpc/client";

import { useAlgorithmUtils, useSelectedAlgorithm } from "./algorithm-context";

export function ClearResultsSection({
  algorithmDisplayName,
}: {
  algorithmDisplayName: string;
}) {
  const { selectedAlgName, setSelectedAlgName } = useSelectedAlgorithm();
  const params = useInstanceParams();
  const router = useRouter();
  const utils = useAlgorithmUtils();

  async function refetchResults() {
    await utils.getAll();
    await utils.allStudentResults();
    await utils.allSupervisorResults();
    await utils.getAllSummaryResults();
  }

  const { mutateAsync: clearResults } =
    api.institution.instance.matching.clearAll.useMutation();

  const { mutateAsync: clearSelectedAlg } =
    api.institution.instance.matching.clearSelection.useMutation();

  function handleClearResults() {
    void toast.promise(
      clearResults({ params }).then(async () => {
        await refetchResults();
        setSelectedAlgName(undefined);
        router.refresh();
      }),
      {
        loading: "Clearing all matching results...",
        success: "Successfully cleared all matching results",
        error: "Failed to clear matching results",
      },
    );
  }

  function handleClearSelectedAlg() {
    void toast.promise(
      clearSelectedAlg({ params }).then(async () => {
        await refetchResults();
        setSelectedAlgName(undefined);
        router.refresh();
      }),
      {
        loading: "Clearing selected allocation...",
        success: "Successfully cleared selected allocation",
        error: "Failed to clear selected allocation",
      },
    );
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 pt-6">
        <Table>
          <TableRow className="flex items-center justify-between">
            <TableCell>
              <p className="text-base">Clear all matching results</p>
            </TableCell>
            <TableCell>
              <YesNoAction
                action={handleClearResults}
                trigger={
                  <Button
                    variant="destructive"
                    className="flex w-40 items-center"
                  >
                    <DatabaseZapIcon className="mr-2 h-4 w-4" />
                    <span>clear results</span>
                  </Button>
                }
                title="Clear all matching results?"
                description="You are about to delete all matching results. This action cannot be undone."
              />
            </TableCell>
          </TableRow>
          <TableRow className="flex items-center justify-between border-b-0">
            <TableCell>
              <p className="text-base">Clear selected allocation</p>
            </TableCell>
            <TableCell>
              <DestructiveAction
                action={handleClearSelectedAlg}
                requiresVerification
              >
                <DestructiveActionTrigger disabled={!selectedAlgName}>
                  <Button
                    variant="destructive"
                    className="flex w-40 items-center"
                    disabled={!selectedAlgName}
                  >
                    <BookmarkXIcon className="mr-2 h-4 w-4" />
                    <span>clear selection</span>
                  </Button>
                </DestructiveActionTrigger>
                <DestructiveActionContent>
                  <DestructiveActionHeader>
                    <DestructiveActionTitle>
                      Are you absolutely sure?
                    </DestructiveActionTitle>
                    <DestructiveActionDescription>
                      This action cannot be undone. This will reset the current
                      project allocation. Only pre-allocated student allocations
                      will be retained.
                    </DestructiveActionDescription>
                  </DestructiveActionHeader>
                  <Label>
                    Please type the selected algorithm name to confirm:{" "}
                  </Label>
                  <DestructiveActionVerificationTypeIn
                    phrase={algorithmDisplayName}
                  />
                  <DestructiveActionFooter>
                    <DestructiveActionCancel asChild>
                      <Button className="w-28">Cancel</Button>
                    </DestructiveActionCancel>
                    <DestructiveActionConfirm asChild>
                      <Button className="w-28" variant="destructive">
                        Yes, delete
                      </Button>
                    </DestructiveActionConfirm>
                  </DestructiveActionFooter>
                </DestructiveActionContent>
              </DestructiveAction>
            </TableCell>
          </TableRow>
        </Table>
      </CardContent>
    </Card>
  );
}
