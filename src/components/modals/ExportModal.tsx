import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  FileText,
  FileSpreadsheet,
  FileImage,
  CheckSquare,
  Square,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  exportToCSV, 
  exportToExcel, 
  exportToPDF, 
  exportSummaryReport,
  exportCustom,
  EXPORT_FIELDS 
} from "@/utils/exportUtils";
import type { Personnel } from "@/integrations/supabase/client";

interface ExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  personnel: Personnel[];
  selectedPersonnel?: Personnel[];
}

export default function ExportModal({
  open,
  onOpenChange,
  personnel,
  selectedPersonnel = [],
}: ExportModalProps) {
  const [exportType, setExportType] = useState<"all" | "selected" | "custom">("all");
  const [format, setFormat] = useState<"csv" | "excel" | "pdf">("csv");
  const [filename, setFilename] = useState("personnel-export");
  const [selectedFields, setSelectedFields] = useState<string[]>([
    "Badge Number",
    "Full Name", 
    "Email",
    "Rank",
    "Unit",
    "Status"
  ]);
  const { toast } = useToast();

  const dataToExport = exportType === "selected" ? selectedPersonnel : personnel;
  const isAllFieldsSelected = selectedFields.length === EXPORT_FIELDS.length;

  const handleFieldToggle = (field: string) => {
    setSelectedFields(prev => 
      prev.includes(field) 
        ? prev.filter(f => f !== field)
        : [...prev, field]
    );
  };

  const handleSelectAllFields = () => {
    if (isAllFieldsSelected) {
      setSelectedFields([]);
    } else {
      setSelectedFields([...EXPORT_FIELDS]);
    }
  };

  const handleExport = () => {
    if (dataToExport.length === 0) {
      toast({
        title: "No Data to Export",
        description: "Please select personnel to export or ensure data is available.",
        variant: "destructive",
      });
      return;
    }

    if (selectedFields.length === 0) {
      toast({
        title: "No Fields Selected",
        description: "Please select at least one field to export.",
        variant: "destructive",
      });
      return;
    }

    try {
      const timestamp = new Date().toISOString().split('T')[0];
      const finalFilename = `${filename}-${timestamp}`;

      if (exportType === "custom") {
        exportCustom(dataToExport, selectedFields, format, finalFilename);
      } else {
        switch (format) {
          case "csv":
            exportToCSV(dataToExport, finalFilename);
            break;
          case "excel":
            exportToExcel(dataToExport, finalFilename);
            break;
          case "pdf":
            exportToPDF(dataToExport, finalFilename);
            break;
        }
      }

      toast({
        title: "✅ Export Successful!",
        description: `${dataToExport.length} personnel records exported as ${format.toUpperCase()}.`,
        duration: 4000,
      });

      onOpenChange(false);
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "❌ Export Failed",
        description: "Something went wrong during export. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSummaryExport = () => {
    try {
      const timestamp = new Date().toISOString().split('T')[0];
      exportSummaryReport(dataToExport, `personnel-summary-${timestamp}`);
      
      toast({
        title: "✅ Summary Report Exported!",
        description: "Personnel summary report has been downloaded.",
        duration: 4000,
      });
    } catch (error) {
      console.error("Summary export error:", error);
      toast({
        title: "❌ Export Failed",
        description: "Failed to generate summary report.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Download className="w-5 h-5 text-blue-600" />
            Export Personnel Data
          </DialogTitle>
          <p className="text-sm text-gray-600 mt-1">
            Choose your export options and download personnel data
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Export Type */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Export Data</Label>
            <div className="grid grid-cols-1 gap-2">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="all"
                  name="exportType"
                  value="all"
                  checked={exportType === "all"}
                  onChange={(e) => setExportType(e.target.value as "all")}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="all" className="text-sm">
                  All Personnel ({personnel.length} records)
                </Label>
              </div>
              
              {selectedPersonnel.length > 0 && (
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="selected"
                    name="exportType"
                    value="selected"
                    checked={exportType === "selected"}
                    onChange={(e) => setExportType(e.target.value as "selected")}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="selected" className="text-sm">
                    Selected Personnel ({selectedPersonnel.length} records)
                  </Label>
                </div>
              )}
              
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="custom"
                  name="exportType"
                  value="custom"
                  checked={exportType === "custom"}
                  onChange={(e) => setExportType(e.target.value as "custom")}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="custom" className="text-sm">
                  Custom Fields Export
                </Label>
              </div>
            </div>
          </div>

          {/* Format Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Export Format</Label>
            <div className="grid grid-cols-3 gap-3">
              <Button
                variant={format === "csv" ? "default" : "outline"}
                onClick={() => setFormat("csv")}
                className="flex items-center gap-2 h-12"
              >
                <FileText className="w-4 h-4" />
                CSV
              </Button>
              <Button
                variant={format === "excel" ? "default" : "outline"}
                onClick={() => setFormat("excel")}
                className="flex items-center gap-2 h-12"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Excel
              </Button>
              <Button
                variant={format === "pdf" ? "default" : "outline"}
                onClick={() => setFormat("pdf")}
                className="flex items-center gap-2 h-12"
                disabled={exportType === "custom"}
              >
                <FileImage className="w-4 h-4" />
                PDF
              </Button>
            </div>
          </div>

          {/* Custom Fields Selection */}
          {exportType === "custom" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Select Fields to Export</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAllFields}
                  className="gap-2"
                >
                  {isAllFieldsSelected ? (
                    <CheckSquare className="w-4 h-4" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                  {isAllFieldsSelected ? "Deselect All" : "Select All"}
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                {EXPORT_FIELDS.map((field) => (
                  <div key={field} className="flex items-center space-x-2">
                    <Checkbox
                      id={field}
                      checked={selectedFields.includes(field)}
                      onCheckedChange={() => handleFieldToggle(field)}
                    />
                    <Label htmlFor={field} className="text-sm">
                      {field}
                    </Label>
                  </div>
                ))}
              </div>
              
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {selectedFields.length} fields selected
                </Badge>
              </div>
            </div>
          )}

          {/* Filename */}
          <div className="space-y-2">
            <Label htmlFor="filename" className="text-sm font-medium">
              Filename (without extension)
            </Label>
            <Input
              id="filename"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder="personnel-export"
            />
          </div>

          {/* Quick Actions */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Quick Export Options</Label>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSummaryExport}
                className="gap-2"
              >
                <FileText className="w-4 h-4" />
                Summary Report
              </Button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleExport}
              className="bg-blue-600 hover:bg-blue-700 gap-2"
            >
              <Download className="w-4 h-4" />
              Export {format.toUpperCase()}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
