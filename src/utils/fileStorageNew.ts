// New file storage system using UploadThing instead of Firebase/Supabase
import type { OurFileRouter } from "@/app/api/uploadthing/core";

export interface FileUploadOptions {
  endpoint: keyof OurFileRouter;
  maxFiles?: number;
  onProgress?: (progress: number) => void;
}

export interface FileUploadResult {
  success: boolean;
  files?: Array<{
    url: string;
    name: string;
    size: number;
  }>;
  error?: string;
}

export interface FileDeleteResult {
  success: boolean;
  error?: string;
}

// File type configurations for different use cases
export const FILE_CONFIGS = {
  IMAGES: {
    maxSize: 4 * 1024 * 1024, // 4MB
    allowedTypes: ["image/jpeg", "image/jpg", "image/png", "image/webp"] as const,
    maxFiles: 1,
  },
  EVIDENCE: {
    maxSize: 64 * 1024 * 1024, // 64MB
    allowedTypes: [
      "image/jpeg", "image/jpg", "image/png", "image/webp",
      "application/pdf",
      "video/mp4", "video/webm", "video/quicktime",
      "audio/mp3", "audio/wav", "audio/mpeg"
    ] as const,
    maxFiles: 10,
  },
  DOCUMENTS: {
    maxSize: 16 * 1024 * 1024, // 16MB
    allowedTypes: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
      "text/csv"
    ] as const,
    maxFiles: 10,
  },
  REPORTS: {
    maxSize: 32 * 1024 * 1024, // 32MB
    allowedTypes: [
      "application/pdf",
      "text/csv",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ] as const,
    maxFiles: 5,
  },
} as const;

// Storage endpoints mapping
export const STORAGE_ENDPOINTS = {
  PERSONNEL_PHOTOS: "personnelPhotos",
  USER_PROFILES: "userProfiles", 
  CASE_EVIDENCE: "caseEvidence",
  DOCUMENTS: "documents",
  REPORTS: "reports",
} as const;

/**
 * Validates a file against the given configuration
 */
export function validateFile(
  file: File,
  config: {
    maxSize: number;
    allowedTypes: readonly string[];
  }
): { isValid: boolean; error?: string } {
  // Check file size
  if (file.size > config.maxSize) {
    const maxSizeMB = Math.round(config.maxSize / (1024 * 1024));
    return {
      isValid: false,
      error: `File size must be less than ${maxSizeMB}MB`,
    };
  }

  // Check file type
  if (config.allowedTypes.length > 0 && !config.allowedTypes.includes(file.type as any)) {
    return {
      isValid: false,
      error: `File type ${file.type} is not allowed`,
    };
  }

  return { isValid: true };
}

/**
 * Validates multiple files against the given configuration
 */
export function validateFiles(
  files: File[],
  config: {
    maxSize: number;
    allowedTypes: readonly string[];
    maxFiles: number;
  }
): { isValid: boolean; error?: string } {
  // Check number of files
  if (files.length > config.maxFiles) {
    return {
      isValid: false,
      error: `Maximum ${config.maxFiles} files allowed`,
    };
  }

  // Validate each file
  for (const file of files) {
    const validation = validateFile(file, config);
    if (!validation.isValid) {
      return validation;
    }
  }

  return { isValid: true };
}

/**
 * Formats file size in human readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

/**
 * Gets the appropriate file icon based on file type
 */
export function getFileIcon(fileType: string): string {
  if (fileType.startsWith("image/")) return "image";
  if (fileType.startsWith("video/")) return "video";
  if (fileType.startsWith("audio/")) return "audio";
  if (fileType === "application/pdf") return "pdf";
  if (fileType.includes("document") || fileType.includes("word")) return "document";
  if (fileType.includes("spreadsheet") || fileType.includes("excel")) return "spreadsheet";
  if (fileType.includes("text")) return "text";
  return "file";
}

/**
 * Generates a unique filename with timestamp
 */
export function generateUniqueFileName(originalName: string): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split('.').pop();
  const nameWithoutExt = originalName.replace(/\.[^/.]+$/, "");
  
  return `${nameWithoutExt}_${timestamp}_${randomString}.${extension}`;
}

/**
 * Extracts file extension from filename
 */
export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

/**
 * Checks if a file is an image
 */
export function isImageFile(fileType: string): boolean {
  return fileType.startsWith("image/");
}

/**
 * Checks if a file is a PDF
 */
export function isPDFFile(fileType: string): boolean {
  return fileType === "application/pdf";
}

/**
 * Checks if a file is a video
 */
export function isVideoFile(fileType: string): boolean {
  return fileType.startsWith("video/");
}

/**
 * Gets MIME type from file extension (fallback)
 */
export function getMimeTypeFromExtension(extension: string): string {
  const mimeTypes: Record<string, string> = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'webp': 'image/webp',
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'txt': 'text/plain',
    'csv': 'text/csv',
    'mp4': 'video/mp4',
    'webm': 'video/webm',
    'mov': 'video/quicktime',
    'mp3': 'audio/mp3',
    'wav': 'audio/wav',
  };
  
  return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
}

// Note: UploadThing handles the actual upload process through the useUploadThing hook
// This file provides utilities and configurations for the new storage system
