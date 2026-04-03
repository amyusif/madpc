// Firebase Storage has been removed.
// Server-side file operations now use Vercel Blob (@vercel/blob).
// This file provides server-side upload/delete for legacy imports.

import { put, del } from "@vercel/blob";
import {
  FILE_CONFIGS,
  STORAGE_FOLDERS,
  validateFile,
  generateUniqueFileName,
  type FileUploadResult,
  type FileDeleteResult,
} from "@/utils/storageUtils";

export { FILE_CONFIGS, STORAGE_FOLDERS, type FileUploadResult, type FileDeleteResult };

export interface FileUploadOptions {
  folder?: string;
  maxSize?: number;
  allowedTypes?: readonly string[];
  generateUniqueName?: boolean;
  makePublic?: boolean;
}

export async function uploadFile(
  file: File,
  options: FileUploadOptions = {}
): Promise<FileUploadResult> {
  try {
    if (options.allowedTypes || options.maxSize) {
      const config = {
        maxSize: options.maxSize || 10 * 1024 * 1024,
        allowedTypes: (options.allowedTypes as readonly string[]) || [],
        extensions: [] as readonly string[],
      };
      const validation = validateFile(file, config);
      if (!validation.isValid) {
        return { success: false, error: validation.error };
      }
    }

    const fileName = options.generateUniqueName
      ? generateUniqueFileName(file.name)
      : file.name;

    const blobPath = options.folder ? `${options.folder}/${fileName}` : fileName;
    const blob = await put(blobPath, file, { access: "public" });

    return {
      success: true,
      url: blob.url,
      path: blobPath,
      size: file.size,
      type: file.type,
    };
  } catch (error) {
    console.error("Blob upload error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Upload failed",
    };
  }
}

export async function deleteFile(filePath: string): Promise<FileDeleteResult> {
  try {
    await del(filePath);
    return { success: true };
  } catch (error) {
    console.error("Blob delete error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Delete failed",
    };
  }
}

export async function getSignedUrl(
  filePath: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  return { success: true, url: filePath };
}

export async function listFiles(): Promise<{ success: boolean; files?: string[]; error?: string }> {
  return { success: true, files: [] };
}
