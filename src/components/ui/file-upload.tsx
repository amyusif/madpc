"use client";

import { useState, useRef, useCallback } from "react";
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
import {
  uploadFile,
  validateFile,
  FILE_CONFIGS,
  type FileUploadOptions,
  type FileUploadResult,
} from "@/utils/fileStorage";

interface FileUploadProps {
  onUploadComplete?: (result: FileUploadResult) => void;
  onUploadStart?: (file: File) => void;
  onUploadProgress?: (progress: number) => void;
  onError?: (error: string) => void;
  options: FileUploadOptions;
  config?: typeof FILE_CONFIGS[keyof typeof FILE_CONFIGS];
  multiple?: boolean;
  disabled?: boolean;
  className?: string;
  accept?: string;
  placeholder?: string;
  showPreview?: boolean;
}

interface UploadedFile {
  file: File;
  result?: FileUploadResult;
  progress: number;
  status: "pending" | "uploading" | "success" | "error";
  error?: string;
}

export function FileUpload({
  onUploadComplete,
  onUploadStart,
  onUploadProgress,
  onError,
  options,
  config,
  multiple = false,
  disabled = false,
  className,
  accept,
  placeholder = "Click to upload or drag and drop",
  showPreview = true,
}: FileUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/")) return Image;
    if (file.type.startsWith("video/")) return Video;
    if (file.type.startsWith("audio/")) return Music;
    if (file.type === "application/pdf" || file.type.includes("document")) return FileText;
    return File;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleFileUpload = useCallback(async (file: File) => {
    // Validate file if config provided
    if (config) {
      const validation = validateFile(file, config);
      if (!validation.isValid) {
        const error = validation.error || "File validation failed";
        onError?.(error);
        setUploadedFiles(prev => prev.map(f => 
          f.file === file ? { ...f, status: "error", error } : f
        ));
        return;
      }
    }

    // Start upload
    onUploadStart?.(file);
    
    setUploadedFiles(prev => prev.map(f => 
      f.file === file ? { ...f, status: "uploading", progress: 0 } : f
    ));

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadedFiles(prev => prev.map(f => {
          if (f.file === file && f.progress < 90) {
            const newProgress = f.progress + Math.random() * 20;
            onUploadProgress?.(newProgress);
            return { ...f, progress: Math.min(newProgress, 90) };
          }
          return f;
        }));
      }, 200);

      const result = await uploadFile(file, options);

      clearInterval(progressInterval);

      if (result.success) {
        setUploadedFiles(prev => prev.map(f => 
          f.file === file 
            ? { ...f, status: "success", progress: 100, result }
            : f
        ));
        onUploadComplete?.(result);
      } else {
        const error = result.error || "Upload failed";
        setUploadedFiles(prev => prev.map(f => 
          f.file === file 
            ? { ...f, status: "error", progress: 0, error }
            : f
        ));
        onError?.(error);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Upload failed";
      setUploadedFiles(prev => prev.map(f => 
        f.file === file 
          ? { ...f, status: "error", progress: 0, error: errorMessage }
          : f
      ));
      onError?.(errorMessage);
    }
  }, [config, options, onUploadStart, onUploadProgress, onUploadComplete, onError]);

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files || disabled) return;

    const newFiles = Array.from(files).map(file => ({
      file,
      progress: 0,
      status: "pending" as const,
    }));

    if (multiple) {
      setUploadedFiles(prev => [...prev, ...newFiles]);
    } else {
      setUploadedFiles(newFiles);
    }

    // Start uploading files
    newFiles.forEach(({ file }) => {
      handleFileUpload(file);
    });
  }, [disabled, multiple, handleFileUpload]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const removeFile = useCallback((fileToRemove: File) => {
    setUploadedFiles(prev => prev.filter(f => f.file !== fileToRemove));
  }, []);

  const getAcceptString = () => {
    if (accept) return accept;
    if (config) return config.extensions.join(",");
    return "*/*";
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Upload Area */}
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer",
          isDragOver
            ? "border-blue-400 bg-blue-50"
            : "border-gray-300 hover:border-gray-400",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept={getAcceptString()}
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
          disabled={disabled}
        />
        
        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-600 mb-2">{placeholder}</p>
        
        {config && (
          <div className="text-xs text-gray-500 space-y-1">
            <p>Supported formats: {config.extensions.join(", ")}</p>
            <p>Max size: {(config.maxSize / (1024 * 1024)).toFixed(1)}MB</p>
          </div>
        )}
        
        <Button
          variant="outline"
          size="sm"
          className="mt-2"
          disabled={disabled}
          onClick={(e) => {
            e.stopPropagation();
            fileInputRef.current?.click();
          }}
        >
          Choose Files
        </Button>
      </div>

      {/* File List */}
      {showPreview && uploadedFiles.length > 0 && (
        <div className="space-y-2">
          {uploadedFiles.map((uploadedFile, index) => {
            const { file, progress, status, error, result } = uploadedFile;
            const FileIcon = getFileIcon(file);

            return (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center gap-3 p-3 border rounded-lg bg-gray-50"
              >
                <FileIcon className="w-5 h-5 text-gray-500 flex-shrink-0" />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <div className="flex items-center gap-2">
                      {status === "success" && (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      )}
                      {status === "error" && (
                        <AlertCircle className="w-4 h-4 text-red-500" />
                      )}
                      {status === "uploading" && (
                        <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(file)}
                        className="h-6 w-6 p-0"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500">
                      {formatFileSize(file.size)}
                    </span>
                    
                    {status === "success" && (
                      <Badge variant="secondary" className="text-xs">
                        Uploaded
                      </Badge>
                    )}
                    {status === "error" && (
                      <Badge variant="destructive" className="text-xs">
                        Failed
                      </Badge>
                    )}
                  </div>
                  
                  {status === "uploading" && (
                    <Progress value={progress} className="mt-2 h-1" />
                  )}
                  
                  {error && (
                    <p className="text-xs text-red-500 mt-1">{error}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
