// Client-side file storage utilities.
// Uploads are proxied through /api/upload (Vercel Blob on the server).
// No Firebase dependency.

export {
  FILE_CONFIGS,
  STORAGE_BUCKETS,
  STORAGE_FOLDERS,
  validateFile,
  generateUniqueFileName,
  type FileUploadResult,
  type FileDeleteResult,
} from "@/utils/storageUtils";

import { generateUniqueFileName as uniqueFileName } from "@/utils/storageUtils";
import type { FileUploadResult, FileDeleteResult } from "@/utils/storageUtils";

export interface FileListResult {
  success: boolean;
  files: Array<{
    name: string;
    path: string;
    url: string;
    size: number;
    type: string;
    created_at?: string;
    metadata?: Record<string, unknown>;
  }>;
  error?: string;
}

const UPLOAD_TYPE_MAP: Record<string, string> = {
  "personnel-photos": "personnel-photo",
  "users/profiles": "user-profile",
  "user-profiles": "user-profile",
  "cases/evidence": "case-evidence",
  "case-evidence": "case-evidence",
  "documents": "document",
  "reports": "report",
};

/**
 * Uploads a file via the /api/upload route (Vercel Blob on server).
 * The `bucket` parameter maps to an upload type for backward compatibility.
 */
export async function uploadFile(
  file: File,
  bucket: string,
  folder: string = "",
  fileName?: string
): Promise<FileUploadResult> {
  try {
    const uploadType = UPLOAD_TYPE_MAP[bucket] ?? "document";

    const formData = new FormData();
    formData.append("file", file, fileName ?? uniqueFileName(file.name));
    formData.append("type", uploadType);
    if (folder) formData.append("folder", folder);

    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const data = await res.json();

    if (!data.success) {
      return { success: false, error: data.error ?? "Upload failed" };
    }

    return {
      success: true,
      url: data.file.url,
      path: data.file.path,
      size: data.file.size,
      type: data.file.type,
    };
  } catch (error) {
    console.error("File upload error:", error);
    return { success: false, error: (error as Error).message || "Upload failed" };
  }
}

/**
 * Deletes a file via the /api/upload/delete route.
 */
export async function deleteFile(bucket: string, filePath: string): Promise<FileDeleteResult> {
  try {
    const res = await fetch("/api/upload/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filePath: `${bucket}/${filePath}` }),
    });
    const data = await res.json();
    return data.success
      ? { success: true, message: "File deleted successfully" }
      : { success: false, error: data.error ?? "Deletion failed" };
  } catch (error) {
    return { success: false, error: (error as Error).message || "Deletion failed" };
  }
}

/**
 * Gets a download URL for a file (returns the URL as-is for Vercel Blob).
 */
export async function getSignedUrl(
  bucket: string,
  filePath: string
): Promise<{ url?: string; error?: string }> {
  return { url: `${bucket}/${filePath}` };
}

/**
 * Lists files — not supported natively; returns empty list.
 */
export async function listFiles(_bucket: string, _folder: string = ""): Promise<FileListResult> {
  return { success: true, files: [] };
}
