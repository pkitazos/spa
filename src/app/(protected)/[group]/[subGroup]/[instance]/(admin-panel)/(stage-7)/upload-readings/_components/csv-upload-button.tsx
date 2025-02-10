"use client";

import React from "react";
import { parse } from "papaparse";
import { toast } from "sonner";
import { z } from "zod";

import { CSVParsingErrorCard } from "@/components/toast-card/csv-parsing-error";
import { Input } from "@/components/ui/input";

import { parseForDuplicates } from "@/lib/utils/csv/parse-for-duplicates-readers";
import { allocateReadersCsvRowSchema } from "@/lib/validations/allocate-readers/csv";
import { NewReaderAllocation } from "@/lib/validations/allocate-readers/new-reader-allocation";

export function CSVUploadButton({
  handleUpload,
  requiredHeaders,
}: {
  handleUpload: (data: NewReaderAllocation[]) => Promise<void>;
  requiredHeaders: string[];
}) {
  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
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
            .array(allocateReadersCsvRowSchema)
            .safeParse(res.data);

          if (!result.success) {
            const allErrors = result.error.errors;
            const uniqueErrors = [...new Set(allErrors)];
            toast.error(
              <CSVParsingErrorCard
                title="CSV data was not formatted correctly. Ensure all rows contain:"
                errors={uniqueErrors}
              />,
            );
            return;
          }

          const { uniqueRows, duplicateRowGuids } = parseForDuplicates(
            result.data,
          );

          if (duplicateRowGuids.size === 0) {
            toast.success("CSV parsed successfully!");
          } else if (uniqueRows.length === 0) {
            toast.error("All rows seem to contain duplicates");
          } else {
            toast.success(`${uniqueRows.length} rows parsed successfully!`);
          }

          handleUpload(
            uniqueRows.map((e) => ({
              project_title: e.project_title,
              student_guid: e.student_guid,
              supervisor_guid: e.supervisor_guid,
              reader_name: e.reader_name,
            })),
          );
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
