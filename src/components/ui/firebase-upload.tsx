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

interface FirebaseUploadProps {
  uploadType: 'personnel-photo' | 'user-profile' | 'case-evidence' | 'document' | 'report';
  onUploadComplete?: (files: { url: string; path: string; name: string; size: number }[]) => void;
  onUploadError?: (error: string) => void;
  maxFiles?: number;
  className?: string;
  disabled?: boolean;
  accept?: string;
  placeholder?: string;
  folder?: string;
}

interface UploadFile extends File {
  id: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  url?: string;
  path?: string;
}

export function FirebaseUpload({
  uploadType,
  onUploadComplete,
  onUploadError,
  maxFiles = 1,
  className,
  disabled = false,
  accept,
  placeholder = "Choose files or drag and drop",
  folder,
}: FirebaseUploadProps) {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const getFileIcon = (file: File) => {
    const type = file?.type || '';
    if (type.startsWith('image/')) return Image;
    if (type.startsWith('video/')) return Video;
    if (type.startsWith('audio/')) return Music;
    if (type === 'application/pdf' || type.includes('document')) return FileText;
    return File;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles || disabled) return;

    const newFiles: UploadFile[] = Array.from(selectedFiles).map(file => ({
      ...file,
      id: Math.random().toString(36).substring(2),
      progress: 0,
      status: 'pending' as const,
    }));

    // Check max files limit
    const totalFiles = files.length + newFiles.length;
    if (totalFiles > maxFiles) {
      toast({
        title: "Too many files",
        description: `Maximum ${maxFiles} file(s) allowed`,
        variant: "destructive",
      });
      return;
    }

    setFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const uploadFiles = async () => {
    if (files.length === 0 || isUploading) return;

    setIsUploading(true);
    const uploadedFiles: { url: string; path: string; name: string; size: number }[] = [];

    try {
      for (const file of files) {
        if (file.status === 'success') continue;

        // Update file status to uploading
        setFiles(prev => prev.map(f => 
          f.id === file.id ? { ...f, status: 'uploading' as const, progress: 0 } : f
        ));

        try {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('type', uploadType);
          if (folder) {
            formData.append('folder', folder);
          }

          const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });

          const result = await response.json().catch(() => null as any);

          if (!response.ok || !result?.success || !result?.file || !result.file.url) {
            // Update file status to error
            setFiles(prev => prev.map(f =>
              f.id === file.id ? {
                ...f,
                status: 'error' as const,
                error: (result && result.error) || `Upload failed (${response.status})`,
              } : f
            ));
            onUploadError?.((result && result.error) || 'Upload failed');
            continue;
          }

          const fileUrl: string = result.file.url;
          const filePath: string = result.file.path ?? (folder ? `${folder}/${file.name}` : file.name);

          // Update file status to success
          setFiles(prev => prev.map(f =>
            f.id === file.id ? {
              ...f,
              status: 'success' as const,
              progress: 100,
              url: fileUrl,
              path: filePath,
            } : f
          ));

          uploadedFiles.push({
            url: fileUrl,
            path: filePath,
            name: file.name,
            size: file.size,
          });

        } catch (error) {
          // Update file status to error
          setFiles(prev => prev.map(f => 
            f.id === file.id ? { 
              ...f, 
              status: 'error' as const, 
              error: 'Network error',
            } : f
          ));

          onUploadError?.('Network error');
        }
      }

      if (uploadedFiles.length > 0) {
        onUploadComplete?.(uploadedFiles);
        toast({
          title: "✅ Upload Complete",
          description: `${uploadedFiles.length} file(s) uploaded successfully`,
        });
      }
    } finally {
      setIsUploading(false);
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
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
          "hover:border-primary/50 hover:bg-primary/5",
          disabled && "opacity-50 cursor-not-allowed",
          !disabled && "cursor-pointer"
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground mb-1">{placeholder}</p>
        <p className="text-xs text-muted-foreground">
          {maxFiles > 1 ? `Up to ${maxFiles} files` : 'Single file only'}
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple={maxFiles > 1}
        accept={accept}
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
        disabled={disabled}
      />

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file) => {
            const FileIcon = getFileIcon(file);
            return (
              <div
                key={file.id}
                className="flex items-center gap-3 p-3 border rounded-lg"
              >
                <FileIcon className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium truncate">{file.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {formatFileSize(file.size)}
                    </Badge>
                    
                    {file.status === 'success' && (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    )}
                    {file.status === 'error' && (
                      <AlertCircle className="w-4 h-4 text-red-500" />
                    )}
                    {file.status === 'uploading' && (
                      <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                    )}
                  </div>
                  
                  {file.status === 'uploading' && (
                    <Progress value={file.progress} className="h-1" />
                  )}
                  
                  {file.status === 'error' && file.error && (
                    <p className="text-xs text-red-500">{file.error}</p>
                  )}
                </div>

                {file.status !== 'uploading' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(file.id)}
                    className="h-6 w-6 p-0"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Button */}
      {files.length > 0 && files.some(f => f.status === 'pending' || f.status === 'error') && (
        <Button
          onClick={uploadFiles}
          disabled={isUploading || disabled}
          className="w-full"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Upload {files.filter(f => f.status === 'pending' || f.status === 'error').length} file(s)
            </>
          )}
        </Button>
      )}
    </div>
  );
}
