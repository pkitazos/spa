"use client";

import { useRef, useState } from "react";

import { TRPCClientError } from "@trpc/client";
import { FileSpreadsheetIcon, FileText, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { spacesLabels } from "@/config/spaces";

import { type SupervisorDTO } from "@/dto";
import { type LinkUserResult } from "@/dto/result/link-user-result";

import { CodeSnippet } from "@/components/code-snippet";
import { SectionHeading } from "@/components/heading";
import { useInstanceParams } from "@/components/params-context";
import { Button } from "@/components/ui/button";
import DataTable from "@/components/ui/data-table/data-table";
import { LabelledSeparator } from "@/components/ui/labelled-separator";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

import { api } from "@/lib/trpc/client";

import { CSVUploadButton } from "./csv-upload-button";
import { type ProcessingResult } from "./csv-validation-utils";
import { FormSection } from "./form-section";
import { useNewSupervisorColumns } from "./new-supervisor-columns";
import {
  newSupervisorSchema,
  type NewSupervisor,
} from "./new-supervisor-schema";

export function AddSupervisorsSection() {
  const router = useRouter();
  const params = useInstanceParams();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [processingResult, setProcessingResult] =
    useState<ProcessingResult | null>(null);

  const addSupervisorsCsvHeaders = newSupervisorSchema
    .keyof()
    .options.toSorted();

  const { data, isLoading, refetch } =
    api.institution.instance.getSupervisors.useQuery({ params });

  const { mutateAsync: api_addSupervisor } =
    api.institution.instance.addSupervisor.useMutation();

  const { mutateAsync: api_addManySupervisors } =
    api.institution.instance.addSupervisors.useMutation();

  const { mutateAsync: api_deleteSupervisor } =
    api.institution.instance.deleteSupervisor.useMutation();

  const { mutateAsync: api_deleteManySupervisors } =
    api.institution.instance.deleteManySupervisors.useMutation();

  async function handleAddSupervisor(data: NewSupervisor) {
    const newSupervisor: SupervisorDTO = {
      id: data.institutionId,
      name: data.fullName,
      email: data.email,
      joined: false,
      allocationLowerBound: 0,
      allocationTarget: data.projectTarget,
      allocationUpperBound: data.projectUpperQuota,
    };

    void toast
      .promise(api_addSupervisor({ params, newSupervisor }), {
        loading: "Adding supervisor...",
        success: `Successfully added supervisor ${newSupervisor.id} to ${spacesLabels.instance.short}`,
        // todo: revisit error reporting method
        error: (err) =>
          err instanceof TRPCClientError
            ? err.message
            : `Failed to add supervisor to ${spacesLabels.instance.short}`,
      })
      .unwrap()
      .then(async () => {
        router.refresh();
        await refetch();
      });
  }

  async function handleAddSupervisors(
    supervisors: SupervisorDTO[],
  ): Promise<LinkUserResult[]> {
    return await toast
      .promise(
        api_addManySupervisors({ params, newSupervisors: supervisors }),
        {
          loading: `Adding ${supervisors.length} supervisors to ${spacesLabels.instance.short}...`,
          success: `Successfully added ${supervisors.length} supervisors to ${spacesLabels.instance.short}`,
          error: (err) =>
            err instanceof TRPCClientError
              ? err.message
              : `Failed to add supervisors to ${spacesLabels.instance.short}`,
        },
      )
      .unwrap()
      .then(async (results) => {
        router.refresh();
        await refetch();
        return results;
      });
  }

  async function deleteSupervisor(supervisorId: string) {
    void toast
      .promise(api_deleteSupervisor({ params, supervisorId }), {
        loading: "Removing supervisor...",
        success: `Successfully removed supervisor ${supervisorId} from ${spacesLabels.instance.short}`,
        error: `Failed to remove supervisor from ${spacesLabels.instance.short}`,
      })
      .unwrap()
      .then(async () => {
        router.refresh();
        await refetch();
      });
  }

  async function deleteManySupervisors(supervisorIds: string[]) {
    void toast
      .promise(api_deleteManySupervisors({ params, supervisorIds }), {
        loading: "Removing supervisors...",
        success: `Successfully removed ${supervisorIds.length} supervisors from ${spacesLabels.instance.short}`,
        error: `Failed to remove supervisors from ${spacesLabels.instance.short}`,
      })
      .unwrap()
      .then(async () => {
        router.refresh();
        await refetch();
      });
  }

  function handleClearResults() {
    setProcessingResult(null);
    setShowErrorModal(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleShowModal() {
    setShowErrorModal(true);
  }

  const columns = useNewSupervisorColumns({
    deleteSupervisor,
    deleteManySupervisors,
  });

  return (
    <>
      <div className="mt-6 flex flex-col gap-6">
        <SectionHeading icon={FileSpreadsheetIcon} className="mb-2">
          Upload using CSV
        </SectionHeading>
        <div className="flex items-center gap-6">
          <CSVUploadButton
            requiredHeaders={addSupervisorsCsvHeaders}
            handleUpload={handleAddSupervisors}
            processingResult={processingResult}
            showErrorModal={showErrorModal}
            onProcessingResultChange={setProcessingResult}
            onShowErrorModalChange={setShowErrorModal}
            fileInputRef={fileInputRef}
          />
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleShowModal}
              disabled={!processingResult}
              className="flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              View Upload Results
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearResults}
              disabled={!processingResult}
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Clear & Upload New
            </Button>
          </div>
        </div>
        <CodeSnippet
          label="must contain header:"
          code={addSupervisorsCsvHeaders.join(",")}
          copyMessage="CSV Headers"
        />
      </div>
      <LabelledSeparator label="or" className="my-6" />
      <FormSection handleAddSupervisor={handleAddSupervisor} />
      <Separator className="my-14" />

      {isLoading ? (
        <Skeleton className="h-20 w-full" />
      ) : (
        <DataTable columns={columns} data={data ?? []} />
      )}
    </>
  );
}
