import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import {
  Upload,
  FileText,
  AlertCircle,
  CheckCircle,
  Download,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabaseHelpers } from "@/integrations/supabase/client";
import { useAppData } from "@/hooks/useAppData";

interface ImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete?: () => void;
}

interface ImportResult {
  success: number;
  errors: string[];
  total: number;
}

export default function ImportModal({
  open,
  onOpenChange,
  onImportComplete,
}: ImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { refreshPersonnel } = useAppData();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      const fileType = selectedFile.name.split('.').pop()?.toLowerCase();
      if (fileType === 'csv' || fileType === 'xlsx' || fileType === 'xls') {
        setFile(selectedFile);
        setResult(null);
      } else {
        toast({
          title: "Invalid File Type",
          description: "Please select a CSV or Excel file.",
          variant: "destructive",
        });
      }
    }
  };

  const parseCSV = (text: string): any[] => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      if (values.length === headers.length) {
        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index];
        });
        data.push(row);
      }
    }

    return data;
  };

  const validatePersonnelData = (data: any): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    const requiredFields = ['Badge Number', 'First Name', 'Last Name', 'Email', 'Rank', 'Unit'];

    requiredFields.forEach(field => {
      if (!data[field] || data[field].trim() === '') {
        errors.push(`Missing required field: ${field}`);
      }
    });

    // Validate email format
    if (data['Email'] && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data['Email'])) {
      errors.push('Invalid email format');
    }

    return { isValid: errors.length === 0, errors };
  };

  const handleImport = async () => {
    if (!file) return;

    setImporting(true);
    setProgress(0);
    setResult(null);

    try {
      const text = await file.text();
      const data = parseCSV(text);

      if (data.length === 0) {
        throw new Error('No valid data found in file');
      }

      const results: ImportResult = {
        success: 0,
        errors: [],
        total: data.length,
      };

      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        setProgress(((i + 1) / data.length) * 100);

        const validation = validatePersonnelData(row);
        if (!validation.isValid) {
          results.errors.push(`Row ${i + 2}: ${validation.errors.join(', ')}`);
          continue;
        }

        try {
          const personnelData = {
            badge_number: row['Badge Number'],
            first_name: row['First Name'],
            last_name: row['Last Name'],
            email: row['Email'],
            phone: row['Phone Number'] || undefined,
            rank: row['Rank'].toLowerCase(),
            unit: row['Unit'].toLowerCase(),
            date_joined: row['Date Joined'] || new Date().toISOString().split('T')[0],
            emergency_contacts: row['Emergency Contacts'] ? row['Emergency Contacts'].split(';').map((c: string) => c.trim()) : [],
            marital_status: row['Marital Status'] || 'Single',
            spouse: row['Spouse'] || '',
            children_count: row['Children Count'] ? parseInt(row['Children Count']) : undefined,
            no_children: false,
            status: (row['Status']?.toLowerCase() || 'active') as "active" | "inactive" | "suspended" | "retired",
          };

          await supabaseHelpers.createPersonnel(personnelData);
          results.success++;
        } catch (error: any) {
          results.errors.push(`Row ${i + 2}: ${error.message}`);
        }
      }

      setResult(results);
      await refreshPersonnel();

      if (results.success > 0) {
        toast({
          title: "✅ Import Completed!",
          description: `Successfully imported ${results.success} out of ${results.total} personnel.`,
          duration: 5000,
        });

        if (onImportComplete) onImportComplete();
      }

    } catch (error: any) {
      console.error('Import error:', error);
      toast({
        title: "❌ Import Failed",
        description: error.message || "Something went wrong during import.",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const template = `Badge Number,First Name,Last Name,Email,Phone Number,Rank,Unit,Date Joined,Marital Status,Spouse,Children Count,Emergency Contacts,Status
SGT001,John,Doe,john.doe@police.gov.gh,+233 24 123 4567,sergeant,patrol,2020-01-15,Married,Jane Doe,0,"Jane Doe - +233 24 987 6543; Robert Doe - +233 20 555 1234",active
CPL002,Jane,Smith,jane.smith@police.gov.gh,+233 24 234 5678,corporal,investigation,2021-03-20,Single,,0,Jane Smith Mother - +233 24 111 2222,active`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'personnel-import-template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Template Downloaded",
      description: "Use this template to format your personnel data for import.",
    });
  };

  const resetModal = () => {
    setFile(null);
    setResult(null);
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) resetModal();
    }}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Upload className="w-5 h-5 text-blue-600" />
            Import Personnel Data
          </DialogTitle>
          <p className="text-sm text-gray-600 mt-1">
            Upload a CSV or Excel file to import personnel data
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Template Download */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-blue-900">Need a template?</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Download our template to ensure your data is formatted correctly.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadTemplate}
                  className="mt-2 border-blue-300 text-blue-700 hover:bg-blue-100"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Template
                </Button>
              </div>
            </div>
          </div>

          {/* File Upload */}
          <div className="space-y-3">
            <Label htmlFor="file-upload" className="text-sm font-medium">
              Select File
            </Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
              <input
                ref={fileInputRef}
                id="file-upload"
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-2">
                Click to select a CSV or Excel file
              </p>
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={importing}
              >
                Choose File
              </Button>
            </div>
            
            {file && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <FileText className="w-4 h-4" />
                <span>{file.name}</span>
                <span className="text-gray-400">({(file.size / 1024).toFixed(1)} KB)</span>
              </div>
            )}
          </div>

          {/* Progress */}
          {importing && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Importing personnel...</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-medium">Import Results</span>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Total Records:</span>
                  <span className="font-medium">{result.total}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Successfully Imported:</span>
                  <span className="font-medium text-green-600">{result.success}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Errors:</span>
                  <span className="font-medium text-red-600">{result.errors.length}</span>
                </div>
              </div>

              {result.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <span className="text-sm font-medium text-red-800">Errors:</span>
                  </div>
                  <div className="max-h-32 overflow-y-auto">
                    {result.errors.slice(0, 5).map((error, index) => (
                      <p key={index} className="text-xs text-red-700">{error}</p>
                    ))}
                    {result.errors.length > 5 && (
                      <p className="text-xs text-red-600 mt-1">
                        ... and {result.errors.length - 5} more errors
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={importing}
            >
              {result ? 'Close' : 'Cancel'}
            </Button>
            <Button
              onClick={handleImport}
              disabled={!file || importing}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {importing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Import Data
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
