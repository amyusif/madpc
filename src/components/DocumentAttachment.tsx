"use client";

import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Paperclip,
  File,
  FileText,
  Download,
  Trash2,
  Plus,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  STORAGE_BUCKETS,
  FILE_CONFIGS,
  deleteFile,
  getSignedUrl,
  type FileUploadResult,
} from "@/utils/fileStorage";

interface DocumentAttachment {
  id: string;
  name: string;
  description?: string;
  file_url: string;
  file_type: string;
  file_size: number;
  uploaded_by: string;
  uploaded_at: string;
}

interface DocumentAttachmentProps {
  entityId: string;
  entityType: "case" | "personnel" | "report" | "duty";
  attachments: DocumentAttachment[];
  onAttachmentsUpdate?: (attachments: DocumentAttachment[]) => void;
  readonly?: boolean;
  title?: string;
  description?: string;
  maxFiles?: number;
}

export function DocumentAttachment({
  entityId,
  entityType,
  attachments,
  onAttachmentsUpdate,
  readonly = false,
  title = "Attachments",
  description = "Upload and manage document attachments",
  maxFiles = 10,
}: DocumentAttachmentProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [uploadName, setUploadName] = useState("");
  const [uploadDescription, setUploadDescription] = useState("");
  const { toast } = useToast();

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    if (fileType === "application/pdf" || fileType.includes("document")) {
      return FileText;
    }
    return File;
  };

  const handleUploadComplete = async (result: FileUploadResult) => {
    if (!result.success || !result.url) {
      toast({
        title: "Upload Failed",
        description: result.error || "Failed to upload document",
        variant: "destructive",
      });
      return;
    }

    try {
      const newAttachment: DocumentAttachment = {
        id: `attachment_${Date.now()}`,
        name: uploadName || result.path?.split("/").pop() || "Document",
        description: uploadDescription,
        file_url: result.url,
        file_type: result.type || "application/octet-stream",
        file_size: result.size || 0,
        uploaded_by: "Current User",
        uploaded_at: new Date().toISOString(),
      };

      const updatedAttachments = [...attachments, newAttachment];
      onAttachmentsUpdate?.(updatedAttachments);

      toast({
        title: "✅ Document Uploaded",
        description: "Document has been uploaded successfully",
        duration: 3000,
      });

      // Reset form
      setUploadName("");
      setUploadDescription("");
      setIsDialogOpen(false);
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to save document metadata",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAttachment = async (attachment: DocumentAttachment) => {
    try {
      // Extract file path from URL
      const url = new URL(attachment.file_url);
      const pathParts = url.pathname.split("/");
      const filePath = pathParts.slice(-2).join("/");

      await deleteFile(STORAGE_BUCKETS.DOCUMENTS, filePath);

      const updatedAttachments = attachments.filter(a => a.id !== attachment.id);
      onAttachmentsUpdate?.(updatedAttachments);

      toast({
        title: "✅ Document Deleted",
        description: "Document has been deleted successfully",
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: "Failed to delete document",
        variant: "destructive",
      });
    }
  };

  const handleDownloadAttachment = async (attachment: DocumentAttachment) => {
    try {
      const url = new URL(attachment.file_url);
      const pathParts = url.pathname.split("/");
      const filePath = pathParts.slice(-2).join("/");

      const { url: signedUrl, error } = await getSignedUrl(
        STORAGE_BUCKETS.DOCUMENTS,
        filePath
      );

      if (error || !signedUrl) {
        throw new Error(error || "Failed to get download URL");
      }

      // Create download link
      const link = document.createElement("a");
      link.href = signedUrl;
      link.download = attachment.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download document",
        variant: "destructive",
      });
    }
  };

  const uploadOptions = {
    bucket: STORAGE_BUCKETS.DOCUMENTS,
    folder: `${entityType}_${entityId}`,
    generateUniqueName: true,
    maxSize: FILE_CONFIGS.DOCUMENTS.maxSize,
    allowedTypes: FILE_CONFIGS.DOCUMENTS.allowedTypes,
  };

  const canUploadMore = attachments.length < maxFiles;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Paperclip className="w-5 h-5" />
              {title}
            </CardTitle>
            <CardDescription>
              {description} ({attachments.length}/{maxFiles})
            </CardDescription>
          </div>
          {!readonly && canUploadMore && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Document
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Upload Document</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="upload-name">Document Name</Label>
                    <Input
                      id="upload-name"
                      value={uploadName}
                      onChange={(e) => setUploadName(e.target.value)}
                      placeholder="Enter document name"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="upload-description">Description (Optional)</Label>
                    <Textarea
                      id="upload-description"
                      value={uploadDescription}
                      onChange={(e) => setUploadDescription(e.target.value)}
                      placeholder="Enter document description"
                      rows={3}
                    />
                  </div>
                  
                  <FileUpload
                    options={uploadOptions}
                    config={FILE_CONFIGS.DOCUMENTS}
                    onUploadComplete={handleUploadComplete}
                    onError={(error) => {
                      toast({
                        title: "Upload Error",
                        description: error,
                        variant: "destructive",
                      });
                    }}
                    placeholder="Upload document (PDF, DOC, TXT)"
                    showPreview={false}
                  />
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {attachments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Paperclip className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No documents attached</p>
          </div>
        ) : (
          <div className="space-y-3">
            {attachments.map((attachment) => {
              const FileIcon = getFileIcon(attachment.file_type);
              
              return (
                <div
                  key={attachment.id}
                  className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50"
                >
                  <FileIcon className="w-8 h-8 text-gray-500 flex-shrink-0" />
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{attachment.name}</p>
                    {attachment.description && (
                      <p className="text-sm text-gray-600 truncate">
                        {attachment.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span>{formatFileSize(attachment.file_size)}</span>
                      <span>•</span>
                      <span>{new Date(attachment.uploaded_at).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>by {attachment.uploaded_by}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {attachment.file_type.includes("pdf") ? "PDF" : "DOC"}
                    </Badge>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownloadAttachment(attachment)}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    
                    {!readonly && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteAttachment(attachment)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
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
