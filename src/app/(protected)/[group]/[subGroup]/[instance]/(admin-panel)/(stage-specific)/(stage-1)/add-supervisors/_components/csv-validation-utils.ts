import { INSTITUTION } from "@/config/institution";

import {
  csvSupervisorSchema,
  type NewSupervisor,
} from "./new-supervisor-schema";

export type FieldError = { field: string; message: string };

export type InvalidRow = {
  rowIndex: number;
  data: NewSupervisor;
  originalRowString: string;
  errors: FieldError[];
};

export type ValidationResult = {
  validRows: NewSupervisor[];
  invalidRows: InvalidRow[];
  fileErrors: string[];
};

export type ProcessingResult = {
  created: number;
  preExisting: number;
  failed: number;
  invalidRows: InvalidRow[];
  fileErrors: string[];
};

export function validateCSVRows(
  data: NewSupervisor[],
  rawLines: string[],
): ValidationResult {
  const validRows: NewSupervisor[] = [];
  const invalidRows: InvalidRow[] = [];

  data.forEach((row, index) => {
    const errors: FieldError[] = [];

    const schemaResult = csvSupervisorSchema.safeParse(row);

    if (!schemaResult.success) {
      schemaResult.error.issues.forEach((issue) => {
        const field = issue.path[0]?.toString() || "unknown";
        errors.push({ field, message: issue.message });
      });
    } else {
      const validatedRow = schemaResult.data;

      if (errors.length === 0) {
        validRows.push(validatedRow);
      }
    }

    if (errors.length > 0) {
      invalidRows.push({
        rowIndex: index + 1,
        data: row,
        originalRowString: rawLines[index + 1] || "",
        errors,
      });
    }
  });

  return { validRows, invalidRows, fileErrors: [] };
}

export function filterDuplicatesWithinCSV(
  validRows: NewSupervisor[],
  rawLines: string[],
  originalValidIndices: number[],
): { uniqueRows: NewSupervisor[]; duplicateRows: InvalidRow[] } {
  const seen = new Set<string>();
  const emailSeen = new Set<string>();
  const uniqueRows: NewSupervisor[] = [];
  const duplicateRows: InvalidRow[] = [];

  validRows.forEach((row, index) => {
    const errors: FieldError[] = [];

    if (seen.has(row.institutionId)) {
      errors.push({
        field: "institutionId",
        message: `Duplicate ${INSTITUTION.ID_NAME} '${row.institutionId}' found in CSV`,
      });
    }

    if (emailSeen.has(row.email)) {
      errors.push({
        field: "email",
        message: `Duplicate email '${row.email}' found in CSV`,
      });
    }

    if (errors.length > 0) {
      const originalIndex = originalValidIndices[index];
      duplicateRows.push({
        rowIndex: originalIndex + 1,
        data: row,
        originalRowString: rawLines[originalIndex + 1] || "",
        errors,
      });
    } else {
      seen.add(row.institutionId);
      emailSeen.add(row.email);
      uniqueRows.push(row);
    }
  });

  return { uniqueRows, duplicateRows };
}

export function generateFailedRowsCSV(
  invalidRows: InvalidRow[],
  requiredHeaders: string[],
): string {
  if (invalidRows.length === 0) return "";

  return [
    requiredHeaders.join(","),
    ...invalidRows.map((row) => row.originalRowString),
  ].join("\n");
}

export function generateErrorReport(result: ProcessingResult): string {
  const lines: string[] = [];

  lines.push("CSV Upload Error Report");
  lines.push("========================");
  lines.push("");

  lines.push("Summary:");
  lines.push(`- Successfully created: ${result.created} supervisors`);
  lines.push(`- Skipped (already exist): ${result.preExisting} supervisors`);
  lines.push(`- Failed: ${result.failed} rows`);
  lines.push("");

  if (result.fileErrors.length > 0) {
    lines.push("File Errors:");
    result.fileErrors.forEach((error) => {
      lines.push(`- ${error}`);
    });
    lines.push("");
  }

  if (result.invalidRows.length > 0) {
    lines.push("Row Errors:");
    result.invalidRows.forEach((row) => {
      lines.push(`Row ${row.rowIndex}:`);
      row.errors.forEach((error) => {
        lines.push(`  - ${error.field}: ${error.message}`);
      });
      lines.push("");
    });
  }

  return lines.join("\n");
}
