// MOVE to hooks

"use client";
import { useEffect, useRef } from "react";
import { unparse } from "papaparse";

export function useCsvExport<T>({
  header,
  rows,
  filename,
}: {
  header: string[];
  rows: T[];
  filename: string;
}) {
  const downloadLinkRef = useRef<HTMLAnchorElement>(null);

  const csvContent = unparse({ fields: header, data: rows });

  useEffect(() => {
    if (downloadLinkRef.current) {
      const link = downloadLinkRef.current;
      link.href =
        `data:text/csv;charset=utf-8,` + encodeURIComponent(csvContent);
      link.download = filename;
    }
  }, [csvContent, filename]);

  const downloadCsv = () => downloadLinkRef.current?.click();

  return { downloadLinkRef, downloadCsv };
}
