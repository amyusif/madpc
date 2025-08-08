"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileUpload } from "@/components/ui/file-upload";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Upload,
  File,
  Image,
  Video,
  Music,
  FileText,
  Download,
  Trash2,
  MoreVertical,
  Eye,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  STORAGE_BUCKETS,
  FILE_CONFIGS,
  deleteFile,
  getSignedUrl,
  listFiles,
  type FileUploadResult,
} from "@/utils/fileStorage";

interface EvidenceFile {
  id: string;
  case_id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  uploaded_by: string;
  uploaded_at: string;
  description?: string;
}

interface CaseEvidenceUploadProps {
  caseId: string;
  caseNumber: string;
  onEvidenceUpdate?: () => void;
  readonly?: boolean;
}

export function CaseEvidenceUpload({
  caseId,
  caseNumber,
  onEvidenceUpdate,
  readonly = false,
}: CaseEvidenceUploadProps) {
  const [evidenceFiles, setEvidenceFiles] = useState<EvidenceFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) return Image;
    if (fileType.startsWith("video/")) return Video;
    if (fileType.startsWith("audio/")) return Music;
    if (fileType === "application/pdf" || fileType.includes("document")) return FileText;
    return File;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const loadEvidenceFiles = async () => {
    setIsLoading(true);
    try {
      // In a real implementation, you would fetch from your database
      // For now, we'll simulate loading files
      const { files } = await listFiles(
        STORAGE_BUCKETS.CASE_EVIDENCE,
        `case_${caseNumber}`
      );
      
      // Convert storage files to evidence files format
      const evidenceFiles: EvidenceFile[] = files.map((file, index) => ({
        id: `evidence_${index}`,
        case_id: caseId,
        file_name: file.name,
        file_url: `${STORAGE_BUCKETS.CASE_EVIDENCE}/case_${caseNumber}/${file.name}`,
        file_type: file.metadata?.mimetype || "application/octet-stream",
        file_size: file.metadata?.size || 0,
        uploaded_by: "Current User",
        uploaded_at: file.created_at || new Date().toISOString(),
      }));

      setEvidenceFiles(evidenceFiles);
    } catch (error) {
      toast({
        title: "Load Failed",
        description: "Failed to load evidence files",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEvidenceFiles();
  }, [caseId, caseNumber]);

  const handleUploadComplete = async (result: FileUploadResult) => {
    if (!result.success || !result.url) {
      toast({
        title: "Upload Failed",
        description: result.error || "Failed to upload evidence",
        variant: "destructive",
      });
      return;
    }

    try {
      // In a real implementation, you would save evidence metadata to database
      const newEvidence: EvidenceFile = {
        id: `evidence_${Date.now()}`,
        case_id: caseId,
        file_name: result.path?.split("/").pop() || "unknown",
        file_url: result.url,
        file_type: result.type || "application/octet-stream",
        file_size: result.size || 0,
        uploaded_by: "Current User",
        uploaded_at: new Date().toISOString(),
      };

      setEvidenceFiles(prev => [...prev, newEvidence]);

      toast({
        title: "✅ Evidence Uploaded",
        description: "Evidence file has been uploaded successfully",
        duration: 3000,
      });

      onEvidenceUpdate?.();
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to save evidence metadata",
        variant: "destructive",
      });
    }
  };

  const handleDeleteEvidence = async (evidence: EvidenceFile) => {
    try {
      // Extract file path from URL
      const url = new URL(evidence.file_url);
      const pathParts = url.pathname.split("/");
      const filePath = pathParts.slice(-2).join("/");

      await deleteFile(STORAGE_BUCKETS.CASE_EVIDENCE, filePath);

      setEvidenceFiles(prev => prev.filter(f => f.id !== evidence.id));

      toast({
        title: "✅ Evidence Deleted",
        description: "Evidence file has been deleted successfully",
        duration: 3000,
      });

      onEvidenceUpdate?.();
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: "Failed to delete evidence file",
        variant: "destructive",
      });
    }
  };

  const handleDownloadEvidence = async (evidence: EvidenceFile) => {
    try {
      const url = new URL(evidence.file_url);
      const pathParts = url.pathname.split("/");
      const filePath = pathParts.slice(-2).join("/");

      const { url: signedUrl, error } = await getSignedUrl(
        STORAGE_BUCKETS.CASE_EVIDENCE,
        filePath
      );

      if (error || !signedUrl) {
        throw new Error(error || "Failed to get download URL");
      }

      // Create download link
      const link = document.createElement("a");
      link.href = signedUrl;
      link.download = evidence.file_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download evidence file",
        variant: "destructive",
      });
    }
  };

  const uploadOptions = {
    bucket: STORAGE_BUCKETS.CASE_EVIDENCE,
    folder: `case_${caseNumber}`,
    generateUniqueName: true,
    maxSize: FILE_CONFIGS.EVIDENCE.maxSize,
    allowedTypes: FILE_CONFIGS.EVIDENCE.allowedTypes,
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Evidence Files</CardTitle>
            <CardDescription>
              Case {caseNumber} - {evidenceFiles.length} file(s)
            </CardDescription>
          </div>
          {!readonly && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Evidence
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Upload Evidence</DialogTitle>
                </DialogHeader>
                <FileUpload
                  options={uploadOptions}
                  config={FILE_CONFIGS.EVIDENCE}
                  onUploadComplete={handleUploadComplete}
                  onError={(error) => {
                    toast({
                      title: "Upload Error",
                      description: error,
                      variant: "destructive",
                    });
                  }}
                  placeholder="Upload evidence files (images, videos, documents)"
                  multiple
                />
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {evidenceFiles.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <File className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No evidence files uploaded</p>
          </div>
        ) : (
          <div className="space-y-3">
            {evidenceFiles.map((evidence) => {
              const FileIcon = getFileIcon(evidence.file_type);
              
              return (
                <div
                  key={evidence.id}
                  className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50"
                >
                  <FileIcon className="w-8 h-8 text-gray-500 flex-shrink-0" />
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{evidence.file_name}</p>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span>{formatFileSize(evidence.file_size)}</span>
                      <span>•</span>
                      <span>{new Date(evidence.uploaded_at).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>by {evidence.uploaded_by}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {evidence.file_type.split("/")[0]}
                    </Badge>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleDownloadEvidence(evidence)}>
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </DropdownMenuItem>
                        {!readonly && (
                          <DropdownMenuItem 
                            onClick={() => handleDeleteEvidence(evidence)}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
