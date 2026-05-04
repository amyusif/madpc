"use client";

import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Download,
  X,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/integrations/database";
import { useAppData } from "@/hooks/useAppData";

interface ExcelImportPersonnelModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete?: () => void;
}

interface ParsedRow {
  service_number: string;
  gender: string;
  rank: string;
  name: string;
  date_to_region: string;
  date_to_station: string;
  station_name: string;
  date_of_last_promotion: string;
  remarks: string;
  contact: string;
  _rowIndex: number;
  _error?: string;
}

// Column header aliases accepted from the Excel sheet
const COLUMN_MAP: Record<string, keyof Omit<ParsedRow, "_rowIndex" | "_error">> = {
  "service number": "service_number",
  "service no": "service_number",
  "sn": "service_number",
  "servicenumber": "service_number",
  "gender": "gender",
  "sex": "gender",
  "rank": "rank",
  "name": "name",
  "full name": "name",
  "fullname": "name",
  "date to region": "date_to_region",
  "datetoregion": "date_to_region",
  "region date": "date_to_region",
  "date to station": "date_to_station",
  "datetostation": "date_to_station",
  "station date": "date_to_station",
  "name of station": "station_name",
  "station name": "station_name",
  "station": "station_name",
  "nameofstation": "station_name",
  "date of last promotion": "date_of_last_promotion",
  "dateoflastpromotion": "date_of_last_promotion",
  "last promotion": "date_of_last_promotion",
  "promotion date": "date_of_last_promotion",
  "remarks": "remarks",
  "status": "remarks",
  "remarks/status": "remarks",
  "remarks / status": "remarks",
  "contact": "contact",
  "phone": "contact",
  "mobile": "contact",
  "telephone": "contact",
};

function normalizeHeader(header: string): string {
  return header.toString().trim().toLowerCase().replace(/\s+/g, " ");
}

function formatExcelDate(value: any): string {
  if (!value) return "";
  // Excel serial date number
  if (typeof value === "number") {
    const date = XLSX.SSF.parse_date_code(value);
    if (date) {
      const month = String(date.m).padStart(2, "0");
      const day = String(date.d).padStart(2, "0");
      return `${date.y}-${month}-${day}`;
    }
  }
  // Already a string date
  const str = String(value).trim();
  if (!str) return "";
  // Try to parse common date formats
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split("T")[0];
  }
  return str;
}

function parseExcelRows(workbook: ReturnType<typeof XLSX.read>): ParsedRow[] {
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rawRows: any[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: "",
    raw: false,
  }) as any[][];

  if (rawRows.length < 2) return [];

  // Build header → field mapping
  const headers = (rawRows[0] as any[]).map(normalizeHeader);
  const fieldMap: Record<number, keyof Omit<ParsedRow, "_rowIndex" | "_error">> = {};
  headers.forEach((h, i) => {
    const field = COLUMN_MAP[h];
    if (field) fieldMap[i] = field;
  });

  const results: ParsedRow[] = [];

  for (let rowIdx = 1; rowIdx < rawRows.length; rowIdx++) {
    const cells = rawRows[rowIdx] as any[];
    // Skip fully empty rows
    if (cells.every((c: any) => !c || String(c).trim() === "")) continue;

    const row: ParsedRow = {
      service_number: "",
      gender: "",
      rank: "",
      name: "",
      date_to_region: "",
      date_to_station: "",
      station_name: "",
      date_of_last_promotion: "",
      remarks: "",
      contact: "",
      _rowIndex: rowIdx + 1,
    };

    Object.entries(fieldMap).forEach(([colIdx, field]) => {
      const val = cells[Number(colIdx)];
      const dateFields = ["date_to_region", "date_to_station", "date_of_last_promotion"];
      if (dateFields.includes(field)) {
        // Try numeric serial date first (raw=false gives strings, but just in case)
        const rawVal = sheet[XLSX.utils.encode_cell({ r: rowIdx, c: Number(colIdx) })];
        if (rawVal && rawVal.t === "n") {
          row[field] = formatExcelDate(rawVal.v);
        } else {
          row[field] = formatExcelDate(val);
        }
      } else {
        row[field] = String(val ?? "").trim();
      }
    });

    // Validate required fields
    if (!row.service_number) {
      row._error = "Service number is required";
    } else if (!row.name) {
      row._error = "Name is required";
    }

    results.push(row);
  }

  return results;
}

function splitName(fullName: string): { first_name: string; last_name: string } {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return { first_name: parts[0], last_name: "" };
  const last_name = parts.pop() ?? "";
  return { first_name: parts.join(" "), last_name };
}

export default function ExcelImportPersonnelModal({
  open,
  onOpenChange,
  onImportComplete,
}: ExcelImportPersonnelModalProps) {
  const { toast } = useToast();
  const { refreshPersonnel } = useAppData();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [step, setStep] = useState<"upload" | "preview" | "result">("upload");
  const [importing, setImporting] = useState(false);
  const [importStats, setImportStats] = useState({ success: 0, failed: 0, errors: [] as string[] });

  const handleFile = (file: File) => {
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: "array", cellDates: false });
        const rows = parseExcelRows(workbook);
        if (rows.length === 0) {
          toast({
            title: "Empty file",
            description: "No data rows were found in the spreadsheet.",
            variant: "destructive",
          });
          return;
        }
        setParsedRows(rows);
        setStep("preview");
      } catch (err) {
        toast({
          title: "Failed to parse file",
          description: err instanceof Error ? err.message : "Invalid Excel file",
          variant: "destructive",
        });
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const validRows = parsedRows.filter((r) => !r._error);
  const errorRows = parsedRows.filter((r) => !!r._error);

  const handleImport = async () => {
    setImporting(true);
    const errors: string[] = [];
    let success = 0;

    for (const row of validRows) {
      try {
        const { first_name, last_name } = splitName(row.name);
        await db.createPersonnel({
          badge_number: row.service_number,
          service_number: row.service_number,
          gender: row.gender || undefined,
          first_name,
          last_name,
          email: `${row.service_number.toLowerCase().replace(/\s+/g, "")}@personnel.local`,
          phone: row.contact || undefined,
          rank: row.rank,
          unit: row.station_name || "Unassigned",
          date_joined: row.date_to_station || new Date().toISOString().split("T")[0],
          emergency_contacts: [],
          marital_status: "Unknown",
          status: "active",
          date_to_region: row.date_to_region || null,
          date_to_station: row.date_to_station || null,
          date_of_last_promotion: row.date_of_last_promotion || null,
          remarks: row.remarks || null,
        });
        success++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        errors.push(`Row ${row._rowIndex} (${row.service_number}): ${msg}`);
      }
    }

    await refreshPersonnel();
    setImportStats({ success, failed: errors.length, errors });
    setStep("result");
    setImporting(false);

    toast({
      title: success > 0 ? "Import Complete" : "Import Failed",
      description: `${success} record(s) imported${errors.length > 0 ? `, ${errors.length} failed` : ""}`,
      variant: errors.length > 0 && success === 0 ? "destructive" : "default",
    });

    if (success > 0) {
      onImportComplete?.();
    }
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      [
        "Service Number",
        "Gender",
        "Rank",
        "Name",
        "Date to Region",
        "Date to Station",
        "Name of Station",
        "Date of Last Promotion",
        "Remarks/Status",
        "Contact",
      ],
      [
        "GPS/001",
        "Male",
        "Constable",
        "John Doe",
        "2022-01-15",
        "2023-06-01",
        "Accra Central",
        "2024-03-10",
        "Active",
        "+233201234567",
      ],
    ];
    const ws = XLSX.utils.aoa_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Personnel");
    XLSX.writeFile(wb, "personnel_import_template.xlsx");
  };

  const reset = () => {
    setParsedRows([]);
    setFileName("");
    setStep("upload");
    setImportStats({ success: 0, failed: 0, errors: [] });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-green-600" />
            Import Personnel from Excel
          </DialogTitle>
        </DialogHeader>

        {/* STEP 1 — Upload */}
        {step === "upload" && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-gray-500">
              Upload an Excel file (.xlsx / .xls) with the required columns. Download the template below to get started.
            </p>

            {/* Column reference */}
            <div className="rounded-lg border bg-blue-50 p-3 text-sm text-blue-800">
              <p className="font-semibold mb-1">Expected columns (order does not matter):</p>
              <div className="grid grid-cols-3 gap-x-4 gap-y-0.5">
                {[
                  "Service Number",
                  "Gender",
                  "Rank",
                  "Name",
                  "Date to Region",
                  "Date to Station",
                  "Name of Station",
                  "Date of Last Promotion",
                  "Remarks/Status",
                  "Contact",
                ].map((col) => (
                  <span key={col} className="text-xs">• {col}</span>
                ))}
              </div>
            </div>

            {/* Drop zone */}
            <div
              className="border-2 border-dashed border-gray-300 rounded-xl p-10 flex flex-col items-center gap-3 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-10 h-10 text-gray-400" />
              <p className="text-gray-600 font-medium">Drop your Excel file here or click to browse</p>
              <p className="text-xs text-gray-400">Supports .xlsx and .xls</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleFileInput}
            />

            <Button
              variant="outline"
              className="self-start gap-2"
              onClick={handleDownloadTemplate}
            >
              <Download className="w-4 h-4" />
              Download Template
            </Button>
          </div>
        )}

        {/* STEP 2 — Preview */}
        {step === "preview" && (
          <div className="flex flex-col gap-4 min-h-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-gray-700">{fileName}</span>
                <Badge variant="secondary">{parsedRows.length} rows detected</Badge>
                {errorRows.length > 0 && (
                  <Badge variant="destructive">{errorRows.length} invalid</Badge>
                )}
                {validRows.length > 0 && (
                  <Badge className="bg-green-100 text-green-700">{validRows.length} ready</Badge>
                )}
              </div>
              <Button variant="ghost" size="sm" onClick={reset}>
                <X className="w-4 h-4 mr-1" /> Change file
              </Button>
            </div>

            {/* Preview Table */}
            <div className="overflow-auto rounded-lg border flex-1">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="w-8">#</TableHead>
                    <TableHead>Service No.</TableHead>
                    <TableHead>Gender</TableHead>
                    <TableHead>Rank</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Date to Region</TableHead>
                    <TableHead>Date to Station</TableHead>
                    <TableHead>Station</TableHead>
                    <TableHead>Last Promotion</TableHead>
                    <TableHead>Remarks</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedRows.map((row) => (
                    <TableRow
                      key={row._rowIndex}
                      className={row._error ? "bg-red-50" : ""}
                    >
                      <TableCell className="text-xs text-gray-400">{row._rowIndex}</TableCell>
                      <TableCell className="font-mono text-sm">{row.service_number}</TableCell>
                      <TableCell>{row.gender}</TableCell>
                      <TableCell>{row.rank}</TableCell>
                      <TableCell>{row.name}</TableCell>
                      <TableCell>{row.date_to_region}</TableCell>
                      <TableCell>{row.date_to_station}</TableCell>
                      <TableCell>{row.station_name}</TableCell>
                      <TableCell>{row.date_of_last_promotion}</TableCell>
                      <TableCell>{row.remarks}</TableCell>
                      <TableCell>{row.contact}</TableCell>
                      <TableCell>
                        {row._error ? (
                          <span className="flex items-center gap-1 text-red-600 text-xs">
                            <AlertCircle className="w-3 h-3" />
                            {row._error}
                          </span>
                        ) : (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t">
              <Button variant="outline" onClick={reset}>
                Cancel
              </Button>
              <Button
                onClick={handleImport}
                disabled={validRows.length === 0 || importing}
                className="gap-2 bg-blue-600 hover:bg-blue-700"
              >
                {importing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                {importing ? "Importing..." : `Import ${validRows.length} Record(s)`}
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3 — Result */}
        {step === "result" && (
          <div className="flex flex-col gap-4 items-center py-6">
            {importStats.success > 0 ? (
              <CheckCircle2 className="w-16 h-16 text-green-500" />
            ) : (
              <AlertCircle className="w-16 h-16 text-red-500" />
            )}
            <h3 className="text-lg font-semibold">
              {importStats.success > 0
                ? "Import Successful"
                : "Import Failed"}
            </h3>
            <div className="flex gap-6 text-center">
              <div>
                <p className="text-3xl font-bold text-green-600">{importStats.success}</p>
                <p className="text-sm text-gray-500">Imported</p>
              </div>
              {importStats.failed > 0 && (
                <div>
                  <p className="text-3xl font-bold text-red-600">{importStats.failed}</p>
                  <p className="text-sm text-gray-500">Failed</p>
                </div>
              )}
            </div>

            {importStats.errors.length > 0 && (
              <div className="w-full max-h-40 overflow-auto rounded-lg border bg-red-50 p-3 text-sm text-red-700 space-y-1">
                {importStats.errors.map((err, i) => (
                  <p key={i} className="text-xs">{err}</p>
                ))}
              </div>
            )}

            <div className="flex gap-3 mt-2">
              <Button variant="outline" onClick={reset}>
                Import Another File
              </Button>
              <Button onClick={handleClose} className="bg-blue-600 hover:bg-blue-700">
                Done
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
