"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/ui/file-upload";
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
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  Info,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  STORAGE_BUCKETS,
  FILE_CONFIGS,
  type FileUploadResult,
} from "@/utils/fileStorage";

interface CSVImportExportProps {
  entityType: "personnel" | "cases" | "duties";
  onImportComplete?: (data: any[]) => void;
  onExportRequest?: () => Promise<any[]>;
  importTemplate?: string;
  className?: string;
}

interface ImportResult {
  success: boolean;
  totalRows: number;
  successRows: number;
  errorRows: number;
  errors: string[];
}

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
  const { toast } = useToast();

  const entityLabels = {
    personnel: "Personnel",
    cases: "Cases",
    duties: "Duties",
  };

  const parseCSV = (csvText: string): any[] => {
    const lines = csvText.split("\n");
    const headers = lines[0].split(",").map(h => h.trim().replace(/"/g, ""));
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = line.split(",").map(v => v.trim().replace(/"/g, ""));
      const row: any = {};
      
      headers.forEach((header, index) => {
        row[header] = values[index] || "";
      });
      
      data.push(row);
    }

    return data;
  };

  const validateImportData = (data: any[]): { valid: any[]; errors: string[] } => {
    const valid = [];
    const errors = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNumber = i + 2; // +2 because of header and 0-based index

      // Basic validation based on entity type
      if (entityType === "personnel") {
        if (!row.badge_number || !row.full_name) {
          errors.push(`Row ${rowNumber}: Badge number and full name are required`);
          continue;
        }
      } else if (entityType === "cases") {
        if (!row.case_number || !row.title) {
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

  const handleImportComplete = async (result: FileUploadResult) => {
    if (!result.success || !result.url) {
      toast({
        title: "Upload Failed",
        description: result.error || "Failed to upload CSV file",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setImportProgress(0);

    try {
      // Fetch and parse CSV file
      const response = await fetch(result.url);
      const csvText = await response.text();
      const parsedData = parseCSV(csvText);

      setImportProgress(30);

      // Validate data
      const { valid, errors } = validateImportData(parsedData);

      setImportProgress(60);

      // Process valid data
      if (valid.length > 0) {
        await onImportComplete?.(valid);
      }

      setImportProgress(100);

      const importResult: ImportResult = {
        success: true,
        totalRows: parsedData.length,
        successRows: valid.length,
        errorRows: errors.length,
        errors,
      };

      setImportResult(importResult);

      if (errors.length === 0) {
        toast({
          title: "✅ Import Successful",
          description: `Successfully imported ${valid.length} ${entityType} records`,
          duration: 5000,
        });
      } else {
        toast({
          title: "⚠️ Import Completed with Errors",
          description: `Imported ${valid.length} records, ${errors.length} errors`,
          variant: "destructive",
          duration: 5000,
        });
      }
    } catch (error) {
      setImportResult({
        success: false,
        totalRows: 0,
        successRows: 0,
        errorRows: 0,
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

      // Convert data to CSV
      const headers = Object.keys(data[0]);
      const csvContent = [
        headers.join(","),
        ...data.map(row => 
          headers.map(header => `"${row[header] || ""}"`).join(",")
        )
      ].join("\n");

      // Create and download file
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${entityType}_export_${new Date().toISOString().split("T")[0]}.${exportFormat}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "✅ Export Successful",
        description: `Exported ${data.length} ${entityType} records`,
        duration: 3000,
      });

      setIsExportDialogOpen(false);
    } catch (error) {
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
    link.download = `${entityType}_import_template.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const uploadOptions = {
    bucket: STORAGE_BUCKETS.IMPORTS,
    folder: entityType,
    generateUniqueName: true,
    maxSize: FILE_CONFIGS.SPREADSHEETS.maxSize,
    allowedTypes: FILE_CONFIGS.SPREADSHEETS.allowedTypes,
  };

  return (
    <div className={`flex gap-2 ${className}`}>
      {/* Import Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
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
                      Use our template to ensure proper formatting
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={downloadTemplate}
                    >
                      <FileSpreadsheet className="w-4 h-4 mr-2" />
                      Download Template
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {!isProcessing && !importResult && (
              <FileUpload
                options={uploadOptions}
                config={FILE_CONFIGS.SPREADSHEETS}
                onUploadComplete={handleImportComplete}
                onError={(error) => {
                  toast({
                    title: "Upload Error",
                    description: error,
                    variant: "destructive",
                  });
                }}
                placeholder="Upload CSV file"
                accept=".csv"
                showPreview={false}
              />
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
                    Import {importResult.success ? "Completed" : "Failed"}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <div className="font-medium">{importResult.totalRows}</div>
                    <div className="text-gray-500">Total</div>
                  </div>
                  <div className="text-center p-2 bg-green-50 rounded">
                    <div className="font-medium text-green-600">{importResult.successRows}</div>
                    <div className="text-gray-500">Success</div>
                  </div>
                  <div className="text-center p-2 bg-red-50 rounded">
                    <div className="font-medium text-red-600">{importResult.errorRows}</div>
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
                    setImportResult(null);
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

      {/* Export Dialog */}
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
                <Select value={exportFormat} onValueChange={(value: "csv" | "xlsx") => setExportFormat(value)}>
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
