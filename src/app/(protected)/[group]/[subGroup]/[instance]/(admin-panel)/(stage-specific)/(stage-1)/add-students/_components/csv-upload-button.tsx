"use client";

import React, { useState } from "react";

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

export function CSVUploadButton({
  handleUpload,
  requiredHeaders,
  flags,
}: {
  handleUpload: (data: StudentDTO[]) => Promise<LinkUserResult[]>;
  requiredHeaders: string[];
  flags: FlagDTO[];
}) {
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [processingResult, setProcessingResult] =
    useState<ProcessingResult | null>(null);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const rawText = await file.text();
      const rawLines = rawText.split("\n");

      // Then parse with Papaparse
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
      // validate file structure
      const fileErrors = validateCSVStructure(data, headers, requiredHeaders);

      if (fileErrors.length > 0) {
        const result: ProcessingResult = {
          created: 0,
          preExisting: 0,
          failed: data.length,
          invalidRows: [],
          fileErrors,
        };
        setProcessingResult(result);

        toast.error("CSV file has structural issues", {
          action: {
            label: "View Details",
            onClick: () => setShowErrorModal(true),
          },
        });
        return;
      }

      // validate individual rows
      const validation = validateCSVRows(data, flags, rawLines);

      // track original indices for duplicate filtering
      const originalValidIndices: number[] = [];
      data.forEach((_, index) => {
        const hasErrors = validation.invalidRows.some(
          (invalid) => invalid.rowIndex === index + 1,
        );
        if (!hasErrors) {
          originalValidIndices.push(index);
        }
      });

      // filter duplicates within CSV
      const { uniqueRows, duplicateRows } = filterDuplicatesWithinCSV(
        validation.validRows,
        rawLines,
        originalValidIndices,
      );

      const allInvalidRows = [...validation.invalidRows, ...duplicateRows];

      // process valid rows if any exist
      let serverResults: LinkUserResult[] = [];
      if (uniqueRows.length > 0) {
        const studentsToCreate = uniqueRows.map((student) => {
          const flag = flags.find((f) => f.id === student.flagId)!;
          return {
            id: student.institutionId,
            name: student.fullName,
            email: student.email,
            flag,
            joined: false,
            latestSubmission: undefined,
          } satisfies StudentDTO;
        });

        try {
          serverResults = await handleUpload(studentsToCreate);
        } catch (error) {
          console.error("Server upload error:", error);
          toast.error("Failed to upload students to server");
          return;
        }
      }

      // determine final results
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

      setProcessingResult(result);

      const hasDetails = preExisting > 0 || failed > 0;

      if (created > 0) {
        toast.success(`Successfully created ${created} students`, {
          action: hasDetails
            ? { label: "View Details", onClick: () => setShowErrorModal(true) }
            : undefined,
        });
      }

      if (preExisting > 0) {
        toast.warning(`${preExisting} students already existed`, {
          action: {
            label: "View Details",
            onClick: () => setShowErrorModal(true),
          },
        });
      }

      if (failed > 0) {
        toast.error(`${failed} rows failed to process`, {
          action: {
            label: "View Details",
            onClick: () => setShowErrorModal(true),
          },
        });
      }

      // if everything succeeded with no warnings, show simple success
      if (created > 0 && preExisting === 0 && failed === 0) {
        toast.success(`Successfully created ${created} students!`);
      }

      // if nothing was processed at all
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
        className="w-56 cursor-pointer"
        type="file"
        accept=".csv"
        onChange={handleFileChange}
      />

      {processingResult && (
        <ErrorReportModal
          open={showErrorModal}
          onOpenChange={setShowErrorModal}
          result={processingResult}
          requiredHeaders={requiredHeaders}
        />
      )}
    </>
  );
}
