import {
  Download,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

import {
  generateErrorReport,
  generateFailedRowsCSV,
  type ProcessingResult,
} from "./csv-validation-utils";

interface ErrorReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result: ProcessingResult;
  requiredHeaders: string[];
}

export function ErrorReportModal({
  open,
  onOpenChange,
  result,
  requiredHeaders,
}: ErrorReportModalProps) {
  const downloadFailedRowsCSV = () => {
    const csv = generateFailedRowsCSV(result.invalidRows, requiredHeaders);
    if (!csv) return;

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "failed-supervisor-rows.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadErrorReport = () => {
    const report = generateErrorReport(result);
    const blob = new Blob([report], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "csv-error-report.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyErrorReport = async () => {
    const report = generateErrorReport(result);
    try {
      await navigator.clipboard.writeText(report);
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            CSV Upload Results
          </DialogTitle>
          <DialogDescription>
            Detailed breakdown of your CSV upload processing
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <div className="font-semibold text-green-900">
                  {result.created}
                </div>
                <div className="text-sm text-green-700">Created</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <div className="font-semibold text-yellow-900">
                  {result.preExisting}
                </div>
                <div className="text-sm text-yellow-700">Already Exist</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg border border-red-200">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <div className="font-semibold text-red-900">
                  {result.failed}
                </div>
                <div className="text-sm text-red-700">Failed</div>
              </div>
            </div>
          </div>

          {/* Download Actions */}
          {(result.failed > 0 || result.fileErrors.length > 0) && (
            <>
              <Separator />
              <div className="flex items-center gap-3">
                <Button
                  onClick={downloadFailedRowsCSV}
                  variant="outline"
                  size="sm"
                  disabled={result.invalidRows.length === 0}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Failed Rows CSV
                </Button>
                <Button
                  onClick={downloadErrorReport}
                  variant="outline"
                  size="sm"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Error Report
                </Button>
                <Button onClick={copyErrorReport} variant="ghost" size="sm">
                  Copy Report
                </Button>
              </div>
            </>
          )}

          {/* Error Details */}
          {(result.fileErrors.length > 0 || result.invalidRows.length > 0) && (
            <>
              <Separator />
              <ScrollArea className="h-64">
                <div className="space-y-4">
                  {/* File Errors */}
                  {result.fileErrors.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-red-900 mb-2 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        File Errors ({result.fileErrors.length})
                      </h4>
                      <div className="space-y-1">
                        {result.fileErrors.map((error, index) => (
                          <div
                            key={index}
                            className="text-sm bg-red-50 p-2 rounded border border-red-200"
                          >
                            {error}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Row Errors */}
                  {result.invalidRows.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-red-900 mb-2 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Row Errors ({result.invalidRows.length})
                      </h4>
                      <div className="space-y-3">
                        {result.invalidRows.map((row) => (
                          <div
                            key={row.rowIndex}
                            className="bg-red-50 p-3 rounded border border-red-200"
                          >
                            <div className="font-medium text-red-900 mb-2">
                              Row {row.rowIndex}
                            </div>
                            <div className="space-y-1">
                              {row.errors.map((error, errorIndex) => (
                                <div
                                  key={errorIndex}
                                  className="flex items-start gap-2 text-sm"
                                >
                                  <Badge
                                    variant="destructive"
                                    className="text-xs"
                                  >
                                    {error.field}
                                  </Badge>
                                  <span className="text-red-700">
                                    {error.message}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
