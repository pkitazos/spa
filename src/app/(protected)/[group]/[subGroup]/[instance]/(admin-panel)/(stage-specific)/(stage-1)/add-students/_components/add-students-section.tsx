"use client";

import { useRef, useState } from "react";

import {
  buildNewStudentSchema,
  type NewStudent,
} from "@/app/(protected)/[group]/[subGroup]/[instance]/(admin-panel)/(stage-specific)/(stage-1)/add-students/_components/new-student-schema";
import { TRPCClientError } from "@trpc/client";
import { FileSpreadsheetIcon, FileText, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { spacesLabels } from "@/config/spaces";

import { type FlagDTO, type StudentDTO } from "@/dto";
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
import { useNewStudentColumns } from "./new-student-columns";

export function AddStudentsSection({ flags }: { flags: FlagDTO[] }) {
  const router = useRouter();
  const params = useInstanceParams();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [processingResult, setProcessingResult] =
    useState<ProcessingResult | null>(null);

  const addStudentsCsvHeaders = buildNewStudentSchema(flags)
    .keyof()
    .options.toSorted();

  const { data, isLoading, refetch } =
    api.institution.instance.getStudents.useQuery({ params });

  const { mutateAsync: addStudentAsync } =
    api.institution.instance.addStudent.useMutation();

  const { mutateAsync: addStudentsAsync } =
    api.institution.instance.addStudents.useMutation();

  const { mutateAsync: removeStudentAsync } =
    api.institution.instance.removeStudent.useMutation();

  const { mutateAsync: removeStudentsAsync } =
    api.institution.instance.removeStudents.useMutation();

  async function handleAddStudent(data: NewStudent) {
    const flag = flags.find((f) => f.id === data.flagId);
    if (!flag) {
      toast.error("Invalid flag selected");
      return;
    }

    const newStudent: StudentDTO = {
      id: data.institutionId,
      name: data.fullName,
      email: data.email,
      flag,
      joined: false,
      latestSubmission: undefined,
    };

    void toast.promise(
      addStudentAsync({ params, newStudent }).then(async () => {
        router.refresh();
        await refetch();
      }),
      {
        loading: "Adding student...",
        success: `Successfully added student ${newStudent.id} to ${spacesLabels.instance.short}`,
        error: (err) =>
          err instanceof TRPCClientError
            ? err.message
            : `Failed to add student to ${spacesLabels.instance.short}`,
      },
    );
  }

  async function handleAddStudents(
    students: StudentDTO[],
  ): Promise<LinkUserResult[]> {
    try {
      const results = await addStudentsAsync({ params, newStudents: students });

      router.refresh();
      await refetch();

      return results;
    } catch (err) {
      console.error("Error adding students:", err);
      throw err;
    }
  }

  async function handleStudentRemoval(studentId: string) {
    void toast.promise(
      removeStudentAsync({ params, studentId }).then(async () => {
        router.refresh();
        await refetch();
      }),
      {
        loading: "Removing student...",
        success: `Successfully removed student ${studentId} from ${spacesLabels.instance.short}`,
        error: `Failed to remove student from ${spacesLabels.instance.short}`,
      },
    );
  }
  async function handleStudentsRemoval(studentIds: string[]) {
    void toast.promise(
      removeStudentsAsync({ params, studentIds }).then(async () => {
        router.refresh();
        await refetch();
      }),
      {
        loading: "Removing students...",
        success: `Successfully removed ${studentIds.length} students from ${spacesLabels.instance.short}`,
        error: `Failed to remove students from ${spacesLabels.instance.short}`,
      },
    );
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

  const columns = useNewStudentColumns({
    removeStudent: handleStudentRemoval,
    removeSelectedStudents: handleStudentsRemoval,
  });

  return (
    <>
      <div className="mt-6 flex flex-col gap-6">
        <SectionHeading icon={FileSpreadsheetIcon} className="mb-2">
          Upload using CSV
        </SectionHeading>
        <div className="flex items-center gap-6">
          <CSVUploadButton
            requiredHeaders={addStudentsCsvHeaders}
            handleUpload={handleAddStudents}
            flags={flags}
            processingResult={processingResult}
            onProcessingResultChange={setProcessingResult}
            showErrorModal={showErrorModal}
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
          code={addStudentsCsvHeaders.join(",")}
          copyMessage="CSV Headers"
        />
      </div>
      <LabelledSeparator label="or" className="my-6" />
      <FormSection handleAddStudent={handleAddStudent} flags={flags} />
      <Separator className="my-14" />
      {isLoading ? (
        <Skeleton className="h-20 w-full" />
      ) : (
        <DataTable
          filters={[
            {
              title: "filter by Flag",
              columnId: "Flag",
              options: flags.map((flag) => ({
                id: flag.displayName,
                displayName: flag.displayName,
              })),
            },
          ]}
          columns={columns}
          data={data ?? []}
        />
      )}
    </>
  );
}
