"use client";

import { useRef } from "react";

import { DownloadIcon } from "lucide-react";

/**
 * @deprecated The zip file produced by this component cannot be opened.
 */
export function DownloadZipFileButton({
  text,
  data,
}: {
  text: string;
  data: { zipData: Buffer; contentType: string; filename: string };
}) {
  const downloadLinkRef = useRef<HTMLAnchorElement | null>(null);

  function handleDownload() {
    if (downloadLinkRef.current) {
      const blob = new Blob([data.zipData], { type: data.contentType });
      const url = window.URL.createObjectURL(blob);

      downloadLinkRef.current.href = url;
      downloadLinkRef.current.download = data.filename;
      downloadLinkRef.current.click();

      window.URL.revokeObjectURL(url);
    }
  }

  return (
    <>
      <button
        className="flex items-center gap-2 text-sm"
        onClick={handleDownload}
      >
        <DownloadIcon className="h-4 w-4" />
        {text && <span>{text}</span>}
      </button>
      <a ref={downloadLinkRef} className="hidden" />
    </>
  );
}
