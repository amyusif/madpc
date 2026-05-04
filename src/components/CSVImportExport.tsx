"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  Info,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ImportResult {
  success: boolean;
  totalRows: number;
  successRows: number;
  errorRows: number;
  errors: string[];
}

interface CSVImportExportProps {
  entityType: "personnel" | "cases" | "duties";
  onImportComplete?: (
    data: any[],
    options?: { department?: string; group?: string }
  ) => Promise<Partial<ImportResult> | void> | Partial<ImportResult> | void;
  onExportRequest?: () => Promise<any[]>;
  importTemplate?: string;
  className?: string;
}

const personnelDepartmentOptions = ["Headquaters", "Police station"];
const personnelGroupOptions = ["Administration Staff", "CID", "Accident Squad"];

export function CSVImportExport({
  entityType,
  onImportComplete,
  onExportRequest,
  importTemplate,
  className,
}: CSVImportExportProps) {
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [exportFormat, setExportFormat] = useState<"csv" | "xlsx">("csv");
  const [personnelDepartment, setPersonnelDepartment] = useState(
    personnelDepartmentOptions[0]
  );
  const [personnelGroup, setPersonnelGroup] = useState(personnelGroupOptions[0]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const entityLabels = {
    personnel: "Personnel",
    cases: "Cases",
    duties: "Duties",
  };

  const parseCSV = (csvText: string): any[] => {
    const rows: string[][] = [];
    let currentCell = "";
    let currentRow: string[] = [];
    let inQuotes = false;

    for (let index = 0; index < csvText.length; index++) {
      const char = csvText[index];
      const next = csvText[index + 1];

      if (char === '"' && inQuotes && next === '"') {
        currentCell += '"';
        index++;
        continue;
      }

      if (char === '"') {
        inQuotes = !inQuotes;
        continue;
      }

      if (char === "," && !inQuotes) {
        currentRow.push(currentCell.trim());
        currentCell = "";
        continue;
      }

      if ((char === "\n" || char === "\r") && !inQuotes) {
        if (char === "\r" && next === "\n") index++;
        currentRow.push(currentCell.trim());
        if (currentRow.some((cell) => cell !== "")) rows.push(currentRow);
        currentRow = [];
        currentCell = "";
        continue;
      }

      currentCell += char;
    }

    currentRow.push(currentCell.trim());
    if (currentRow.some((cell) => cell !== "")) rows.push(currentRow);
    if (rows.length < 2) return [];

    const headers = rows[0].map((header) => header.trim());
    return rows.slice(1).map((values) => {
      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || "";
      });
      return row;
    });
  };

  const validateImportData = (data: any[]): { valid: any[]; errors: string[] } => {
    const valid = [];
    const errors = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNumber = i + 2;

      if (entityType === "personnel") {
        valid.push(row);
        continue;
      } else if (entityType === "cases") {
        const caseNumber = row.case_number || row["Case Number"];
        const title = row.case_title || row["Case Title"] || row.title || row.Title;
        if (!caseNumber || !title) {
          errors.push(`Row ${rowNumber}: Case number and title are required`);
          continue;
        }
      } else if (entityType === "duties") {
        if (!row.title || !row.date) {
          errors.push(`Row ${rowNumber}: Title and date are required`);
          continue;
        }
      }

      valid.push(row);
    }

    return { valid, errors };
  };

  const resetImport = () => {
    setImportResult(null);
    setImportProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleImportFile = async (file?: File) => {
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".csv")) {
      toast({
        title: "Invalid File",
        description: "Please choose a CSV file.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setImportProgress(0);

    try {
      const csvText = await file.text();
      const parsedData = parseCSV(csvText);

      setImportProgress(30);

      const { valid, errors } = validateImportData(parsedData);

      setImportProgress(60);

      let handlerResult: Partial<ImportResult> | void = undefined;
      if (valid.length > 0) {
        handlerResult = await onImportComplete?.(
          valid,
          entityType === "personnel"
            ? { department: personnelDepartment, group: personnelGroup }
            : undefined
        );
      }

      setImportProgress(100);

      const allErrors = [...errors, ...(handlerResult?.errors ?? [])];
      const result: ImportResult = {
        success: allErrors.length === 0,
        totalRows: parsedData.length,
        successRows: handlerResult?.successRows ?? valid.length,
        errorRows: allErrors.length,
        errors: allErrors,
      };

      setImportResult(result);

      if (allErrors.length === 0) {
        toast({
          title: "Import Successful",
          description: `Successfully imported ${result.successRows} ${entityType} records`,
          duration: 5000,
        });
      } else {
        toast({
          title: "Import Completed with Errors",
          description: `Imported ${result.successRows} records, ${result.errorRows} errors`,
          variant: result.successRows === 0 ? "destructive" : "default",
          duration: 5000,
        });
      }
    } catch (error) {
      setImportResult({
        success: false,
        totalRows: 0,
        successRows: 0,
        errorRows: 1,
        errors: [error instanceof Error ? error.message : "Import failed"],
      });

      toast({
        title: "Import Failed",
        description: "Failed to process CSV file",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExport = async () => {
    if (!onExportRequest) return;

    setIsProcessing(true);

    try {
      const data = await onExportRequest();

      if (data.length === 0) {
        toast({
          title: "No Data",
          description: `No ${entityType} data available for export`,
          variant: "destructive",
        });
        return;
      }

      const headers = Object.keys(data[0]);
      const csvContent = [
        headers.join(","),
        ...data.map((row) =>
          headers
            .map((header) => `"${String(row[header] ?? "").replace(/"/g, '""')}"`)
            .join(",")
        ),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${entityType}_export_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export Successful",
        description: `Exported ${data.length} ${entityType} records`,
        duration: 3000,
      });

      setIsExportDialogOpen(false);
    } catch {
      toast({
        title: "Export Failed",
        description: "Failed to export data",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadTemplate = () => {
    if (!importTemplate) return;

    const blob = new Blob([importTemplate], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${entityType}_template.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className={`flex gap-2 ${className}`}>
      <Dialog
        open={isImportDialogOpen}
        onOpenChange={(open) => {
          setIsImportDialogOpen(open);
          if (!open) resetImport();
        }}
      >
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Upload className="w-4 h-4 mr-2" />
            Import {entityLabels[entityType]}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Import {entityLabels[entityType]} from CSV</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {importTemplate && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">
                      Download Template
                    </p>
                    <p className="text-sm text-blue-700 mb-2">
                      Use the template to ensure proper formatting.
                    </p>
                    <Button variant="outline" size="sm" onClick={downloadTemplate}>
                      <FileSpreadsheet className="w-4 h-4 mr-2" />
                      Download Template
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {!isProcessing && !importResult && (
              <div className="space-y-4">
                {entityType === "personnel" && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Department</Label>
                      <Select
                        value={personnelDepartment}
                        onValueChange={setPersonnelDepartment}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {personnelDepartmentOptions.map((department) => (
                            <SelectItem key={department} value={department}>
                              {department}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Group</Label>
                      <Select value={personnelGroup} onValueChange={setPersonnelGroup}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {personnelGroupOptions.map((group) => (
                            <SelectItem key={group} value={group}>
                              {group}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                <div
                  className="flex cursor-pointer flex-col items-center gap-3 rounded-lg border-2 border-dashed border-gray-300 p-8 text-center transition-colors hover:border-blue-400 hover:bg-blue-50"
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={(event) => {
                    event.preventDefault();
                    handleImportFile(event.dataTransfer.files[0]);
                  }}
                  onDragOver={(event) => event.preventDefault()}
                >
                  <Upload className="h-8 w-8 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      Drop a CSV file here or click to browse
                    </p>
                    <p className="text-xs text-gray-500">Only .csv files are supported</p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,text/csv"
                    className="hidden"
                    onChange={(event) => handleImportFile(event.target.files?.[0])}
                  />
                </div>
              </div>
            )}

            {isProcessing && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-blue-500" />
                  <span className="text-sm font-medium">Processing CSV file...</span>
                </div>
                <Progress value={importProgress} className="h-2" />
              </div>
            )}

            {importResult && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  {importResult.success ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  )}
                  <span className="text-sm font-medium">
                    Import {importResult.success ? "Completed" : "Completed with Errors"}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <div className="font-medium">{importResult.totalRows}</div>
                    <div className="text-gray-500">Total</div>
                  </div>
                  <div className="text-center p-2 bg-green-50 rounded">
                    <div className="font-medium text-green-600">
                      {importResult.successRows}
                    </div>
                    <div className="text-gray-500">Success</div>
                  </div>
                  <div className="text-center p-2 bg-red-50 rounded">
                    <div className="font-medium text-red-600">
                      {importResult.errorRows}
                    </div>
                    <div className="text-gray-500">Errors</div>
                  </div>
                </div>

                {importResult.errors.length > 0 && (
                  <div className="max-h-32 overflow-y-auto">
                    <p className="text-sm font-medium text-red-600 mb-2">Errors:</p>
                    {importResult.errors.map((error, index) => (
                      <p key={index} className="text-xs text-red-600 mb-1">
                        {error}
                      </p>
                    ))}
                  </div>
                )}

                <Button
                  onClick={() => {
                    resetImport();
                    setIsImportDialogOpen(false);
                  }}
                  className="w-full"
                >
                  Close
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {onExportRequest && (
        <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export {entityLabels[entityType]}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Export {entityLabels[entityType]} Data</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Export Format</label>
                <Select
                  value={exportFormat}
                  onValueChange={(value: "csv" | "xlsx") => setExportFormat(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv">CSV (.csv)</SelectItem>
                    <SelectItem value="xlsx">Excel (.xlsx)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleExport}
                  disabled={isProcessing}
                  className="flex-1"
                >
                  {isProcessing ? (
                    <>Processing...</>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Export Data
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsExportDialogOpen(false)}
                  disabled={isProcessing}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
