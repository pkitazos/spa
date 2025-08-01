"use client";

import { type RefObject } from "react";

import { parse } from "papaparse";
import { toast } from "sonner";

import { type FlagDTO, type StudentDTO } from "@/dto";
import { LinkUserResult } from "@/dto/result/link-user-result";

import { Input } from "@/components/ui/input";

import { type NewStudent } from "@/lib/validations/add-users/new-user";

import {
  validateCSVStructure,
  validateCSVRows,
  filterDuplicatesWithinCSV,
  type ProcessingResult,
} from "./csv-validation-utils";
import { ErrorReportModal } from "./error-report-modal";

interface CSVUploadButtonProps {
  handleUpload: (data: StudentDTO[]) => Promise<LinkUserResult[]>;
  requiredHeaders: string[];
  flags: FlagDTO[];
  processingResult: ProcessingResult | null;
  showErrorModal: boolean;
  onProcessingResultChange: (result: ProcessingResult | null) => void;
  onShowErrorModalChange: (show: boolean) => void;
  fileInputRef: RefObject<HTMLInputElement>;
}

export function CSVUploadButton({
  handleUpload,
  requiredHeaders,
  flags,
  processingResult,
  showErrorModal,
  onProcessingResultChange,
  onShowErrorModalChange,
  fileInputRef,
}: CSVUploadButtonProps) {
  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const rawText = await file.text();
      const rawLines = rawText.split("\n");

      parse<NewStudent>(file, {
        complete: (res) => {
          void processCSVData(res.data, res.meta.fields, rawLines);
        },
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
      });
    } catch (error) {
      console.error("Error reading file:", error);
      toast.error("Failed to read the CSV file");
    }
  }

  async function processCSVData(
    data: NewStudent[],
    headers: string[] | undefined,
    rawLines: string[],
  ) {
    try {
      const fileErrors = validateCSVStructure(data, headers, requiredHeaders);

      if (fileErrors.length > 0) {
        const result: ProcessingResult = {
          created: 0,
          preExisting: 0,
          failed: data.length,
          invalidRows: [],
          fileErrors,
        };
        onProcessingResultChange(result);

        toast.error("CSV file has structural issues", {
          action: {
            label: "View Details",
            onClick: () => onShowErrorModalChange(true),
          },
        });
        return;
      }

      const validation = validateCSVRows(data, flags, rawLines);

      const originalValidIndices: number[] = [];
      data.forEach((_, index) => {
        const hasErrors = validation.invalidRows.some(
          (invalid) => invalid.rowIndex === index + 1,
        );
        if (!hasErrors) {
          originalValidIndices.push(index);
        }
      });

      const { uniqueRows, duplicateRows } = filterDuplicatesWithinCSV(
        validation.validRows,
        rawLines,
        originalValidIndices,
      );

      const allInvalidRows = [...validation.invalidRows, ...duplicateRows];

      let serverResults: LinkUserResult[] = [];
      if (uniqueRows.length > 0) {
        const studentsToCreate = uniqueRows.map((student) => ({
          id: student.institutionId,
          name: student.fullName,
          email: student.email,
          flag: flags.find((f) => f.id === student.flagId)!,
          joined: false,
          latestSubmission: undefined,
        }));

        try {
          serverResults = await handleUpload(studentsToCreate);
        } catch (error) {
          console.error("Server upload error:", error);
          toast.error("Failed to upload students to server");
          return;
        }
      }

      const created = serverResults.filter(
        (r) => r === LinkUserResult.CREATED_NEW || r === LinkUserResult.OK,
      ).length;

      const preExisting = serverResults.filter(
        (r) => r === LinkUserResult.PRE_EXISTING,
      ).length;

      const failed = allInvalidRows.length;

      const result: ProcessingResult = {
        created,
        preExisting,
        failed,
        invalidRows: allInvalidRows,
        fileErrors: [],
      };

      onProcessingResultChange(result);

      const hasDetails = preExisting > 0 || failed > 0;

      if (created > 0) {
        toast.success(`Successfully created ${created} students`, {
          action: hasDetails
            ? {
                label: "View Details",
                onClick: () => onShowErrorModalChange(true),
              }
            : undefined,
        });
      }

      if (preExisting > 0) {
        toast.warning(`${preExisting} students already existed`, {
          action: {
            label: "View Details",
            onClick: () => onShowErrorModalChange(true),
          },
        });
      }

      if (failed > 0) {
        toast.error(`${failed} rows failed to process`, {
          action: {
            label: "View Details",
            onClick: () => onShowErrorModalChange(true),
          },
        });
      }

      // everything succeeded with no warnings
      if (created > 0 && preExisting === 0 && failed === 0) {
        toast.success(`Successfully created ${created} students!`);
      }

      // nothing was processed at all
      if (created === 0 && preExisting === 0 && failed === 0) {
        toast.warning("No valid rows found to process");
      }
    } catch (error) {
      console.error("Error processing CSV:", error);
      toast.error("An unexpected error occurred while processing the CSV");
    }
  }

  return (
    <>
      <Input
        ref={fileInputRef}
        className="w-56 cursor-pointer"
        type="file"
        accept=".csv"
        onChange={handleFileChange}
      />

      {processingResult && (
        <ErrorReportModal
          open={showErrorModal}
          onOpenChange={onShowErrorModalChange}
          result={processingResult}
          requiredHeaders={requiredHeaders}
        />
      )}
    </>
  );
}
