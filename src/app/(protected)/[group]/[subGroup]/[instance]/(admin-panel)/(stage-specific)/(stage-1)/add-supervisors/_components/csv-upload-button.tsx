"use client";

import React from "react";

import { parse } from "papaparse";
import { toast } from "sonner";
import { z } from "zod";

import { CSVParsingErrorCard } from "@/components/toast-card/csv-parsing-error";
import { UserCreationErrorCard } from "@/components/toast-card/user-creation-error";
import { Input } from "@/components/ui/input";

import { parseForDuplicates } from "@/lib/utils/csv/parse-for-duplicates";
import { addSupervisorsCsvRowSchema } from "@/lib/validations/add-users/csv";
import { type NewSupervisor } from "@/lib/validations/add-users/new-user";

export function CSVUploadButton({
  handleUpload,
  requiredHeaders,
}: {
  handleUpload: (data: NewSupervisor[]) => Promise<void>;
  requiredHeaders: string[];
}) {
  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    // TODO: handle multiple files
    const fileList = event.target.files;
    if (fileList && fileList.length > 0) {
      const file = fileList[0];
      parse(file, {
        complete: (res) => {
          const headers = res.meta.fields;
          if (!headers) {
            toast.error("CSV does not contain headers");
            return;
          }

          if (requiredHeaders.join() !== headers.join()) {
            toast.error("CSV does not have the required headers");
            return;
          }

          const result = z
            .array(addSupervisorsCsvRowSchema)
            .safeParse(res.data);

          if (!result.success) {
            const allErrors = result.error.issues;
            const uniqueErrors = [...new Set(allErrors)];
            toast.error(
              <CSVParsingErrorCard
                title="CSV data was not formatted correctly. Ensure all rows contain:"
                errors={uniqueErrors}
              />,
            );
            return;
          }

          const { uniqueRows, duplicateRowInstitutionIds } = parseForDuplicates(
            result.data.map((row) => ({
              institutionId: row.guid,
              fullName: row.full_name,
              email: row.email,
              projectTarget: row.project_target,
              projectUpperQuota: row.project_upper_quota,
            })),
          );

          if (duplicateRowInstitutionIds.length === 0) {
            toast.success("CSV parsed successfully!");
          } else if (uniqueRows.length === 0) {
            toast.error("All rows seem to contain duplicates");
          } else {
            toast.success(`${uniqueRows.length} rows parsed successfully!`);
            toast.error(
              <UserCreationErrorCard
                error={`${duplicateRowInstitutionIds.length} duplicate rows found`}
                affectedUsers={Array.from(duplicateRowInstitutionIds)}
              />,
            );
          }

          void handleUpload(uniqueRows);
        },
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
      });
    }
  }

  return (
    <Input
      className="w-56 cursor-pointer"
      type="file"
      accept=".csv"
      onChange={handleFileChange}
    />
  );
}
