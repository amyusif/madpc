"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  X,
  File,
  Image,
  FileText,
  Video,
  Music,
  AlertCircle,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface UploadThingUploadProps {
  endpoint: string;
  onUploadComplete?: (files: { url: string; name: string; size: number }[]) => void;
  onUploadError?: (error: string) => void;
  maxFiles?: number;
  className?: string;
  disabled?: boolean;
  accept?: string;
  placeholder?: string;
}

export function UploadThingUpload({
  endpoint,
  onUploadComplete,
  onUploadError,
  maxFiles = 1,
  className,
  disabled = false,
  accept,
  placeholder = "Choose files or drag and drop",
}: UploadThingUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Simulate UploadThing upload for now - replace with actual UploadThing integration
  const startUpload = async (filesToUpload: File[]) => {
    setIsUploading(true);
    try {
      // For now, create mock URLs - replace with actual UploadThing upload
      const uploadedFiles = filesToUpload.map(file => ({
        url: URL.createObjectURL(file), // This would be the UploadThing URL
        name: file.name,
        size: file.size,
      }));

      onUploadComplete?.(uploadedFiles);
      setFiles([]);
      setUploadProgress({});

      toast({
        title: "✅ Upload Complete",
        description: `${uploadedFiles.length} file(s) uploaded successfully`,
      });
    } catch (error: any) {
      console.error("Upload error:", error);
      const errorMessage = error?.message || "Upload failed";
      onUploadError?.(errorMessage);

      toast({
        title: "❌ Upload Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const getFileIcon = (file: File) => {
    const type = file.type;
    if (type.startsWith("image/")) return Image;
    if (type.startsWith("video/")) return Video;
    if (type.startsWith("audio/")) return Music;
    if (type === "application/pdf" || type.includes("document")) return FileText;
    return File;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const newFiles = Array.from(selectedFiles);
    const totalFiles = files.length + newFiles.length;

    if (totalFiles > maxFiles) {
      toast({
        title: "Too Many Files",
        description: `Maximum ${maxFiles} file(s) allowed`,
        variant: "destructive",
      });
      return;
    }

    setFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    
    try {
      await startUpload(files);
    } catch (error) {
      console.error("Upload initiation failed:", error);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className={cn(
          "border-2 border-dashed border-gray-300 rounded-lg p-6 text-center transition-colors",
          "hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50",
          disabled && "opacity-50 cursor-not-allowed",
          isUploading && "border-blue-500 bg-blue-50"
        )}
      >
        <input
          type="file"
          multiple={maxFiles > 1}
          accept={accept}
          onChange={(e) => handleFileSelect(e.target.files)}
          disabled={disabled || isUploading}
          className="hidden"
          id={`file-upload-${String(endpoint)}`}
        />
        
        <label
          htmlFor={`file-upload-${String(endpoint)}`}
          className={cn(
            "cursor-pointer flex flex-col items-center gap-2",
            (disabled || isUploading) && "cursor-not-allowed"
          )}
        >
          {isUploading ? (
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          ) : (
            <Upload className="w-8 h-8 text-gray-400" />
          )}
          
          <div>
            <p className="text-sm font-medium text-gray-700">
              {isUploading ? "Uploading..." : placeholder}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {maxFiles > 1 ? `Up to ${maxFiles} files` : "Single file"}
            </p>
          </div>
        </label>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, index) => {
            const FileIcon = getFileIcon(file);
            const progress = uploadProgress[file.name] || uploadProgress.global || 0;
            
            return (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center gap-3 p-3 border rounded-lg bg-gray-50"
              >
                <FileIcon className="w-6 h-6 text-gray-500 flex-shrink-0" />
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>{formatFileSize(file.size)}</span>
                    <Badge variant="secondary" className="text-xs">
                      {file.type || "Unknown"}
                    </Badge>
                  </div>
                  
                  {isUploading && (
                    <Progress value={progress} className="mt-2 h-1" />
                  )}
                </div>
                
                {!isUploading && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Button */}
      {files.length > 0 && !isUploading && (
        <Button
          onClick={handleUpload}
          disabled={disabled || isUploading}
          className="w-full"
        >
          <Upload className="w-4 h-4 mr-2" />
          Upload {files.length} file(s)
        </Button>
      )}
    </div>
  );
}
