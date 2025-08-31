import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject, listAll, getMetadata } from "firebase/storage";
import { getFirebaseApp } from "@/integrations/firebase/client";

const useFirebase = () => true; // Always use Firebase now

export interface FileUploadResult {
  success: boolean;
  url?: string;
  path?: string;
  size?: number;
  type?: string;
  error?: string;
}

export interface FileDeleteResult {
  success: boolean;
  message?: string;
  error?: string;
}

export interface FileListResult {
  success: boolean;
  files: Array<{
    name: string;
    path: string;
    url: string;
    size: number;
    type: string;
    created_at?: string;
    metadata?: any;
  }>;
  error?: string;
}

// File storage buckets
export const STORAGE_BUCKETS = {
  USER_PROFILES: "user-profiles",
  PERSONNEL_PHOTOS: "personnel-photos",
  CASE_EVIDENCE: "case-evidence",
  DOCUMENTS: "documents",
  REPORTS: "reports",
  IMPORTS: "imports",
} as const;

// File type configurations
export const FILE_CONFIGS = {
  IMAGES: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
    extensions: [".jpg", ".jpeg", ".png", ".webp"],
  },
  DOCUMENTS: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ],
    extensions: [".pdf", ".doc", ".docx", ".txt"],
  },
  SPREADSHEETS: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: [
      "text/csv",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ],
    extensions: [".csv", ".xls", ".xlsx"],
  },
  EVIDENCE: {
    maxSize: 50 * 1024 * 1024, // 50MB
    allowedTypes: [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "application/pdf",
      "video/mp4",
      "video/webm",
      "audio/mp3",
      "audio/wav",
    ],
    extensions: [
      ".jpg",
      ".jpeg",
      ".png",
      ".webp",
      ".pdf",
      ".mp4",
      ".webm",
      ".mp3",
      ".wav",
    ],
  },
} as const;

/**
 * Validates file against specified configuration
 */
export function validateFile(
  file: File,
  config: { readonly maxSize: number; readonly allowedTypes: readonly string[]; readonly extensions: readonly string[] }
): { isValid: boolean; error?: string } {
  // Check file size
  if (file.size > config.maxSize) {
    return {
      isValid: false,
      error: `File size exceeds ${(config.maxSize / (1024 * 1024)).toFixed(
        1
      )}MB limit`,
    };
  }

  // Check file type
  if (!config.allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `File type not allowed. Supported types: ${config.extensions.join(
        ", "
      )}`,
    };
  }

  return { isValid: true };
}

/**
 * Generates a unique filename
 */
export function generateUniqueFileName(originalName: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const extension = originalName.substring(originalName.lastIndexOf("."));
  const nameWithoutExt = originalName.substring(
    0,
    originalName.lastIndexOf(".")
  );

  return `${nameWithoutExt}_${timestamp}_${random}${extension}`;
}

/**
 * Uploads a file to Firebase Storage
 * @param file - The file to upload
 * @param bucket - The storage bucket name
 * @param folder - The folder path within the bucket
 * @param fileName - Optional custom filename
 * @returns Promise with upload result
 */
export async function uploadFile(
  file: File,
  bucket: string,
  folder: string = "",
  fileName?: string
): Promise<FileUploadResult> {
  try {
    if (!useFirebase()) {
      throw new Error("Firebase storage is required");
    }

    const storage = getStorage(getFirebaseApp());
    const finalFileName = fileName || generateUniqueFileName(file.name);
    const filePath = folder ? `${folder}/${finalFileName}` : finalFileName;
    const storageRef = ref(storage, `${bucket}/${filePath}`);

    // Upload file with metadata
    const metadata = {
      contentType: file.type,
      customMetadata: {
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
      }
    };

    const snapshot = await uploadBytes(storageRef, file, metadata);
    const downloadURL = await getDownloadURL(snapshot.ref);

    return {
      success: true,
      url: downloadURL,
      path: filePath,
      size: file.size,
      type: file.type,
    };
  } catch (error: any) {
    console.error("File upload error:", error);
    return {
      success: false,
      error: error.message || "Upload failed",
    };
  }
}

/**
 * Deletes a file from Firebase Storage
 * @param bucket - The storage bucket name
 * @param filePath - The file path within the bucket
 * @returns Promise with deletion result
 */
export async function deleteFile(
  bucket: string,
  filePath: string
): Promise<FileDeleteResult> {
  try {
    if (!useFirebase()) {
      throw new Error("Firebase storage is required");
    }

    const storage = getStorage(getFirebaseApp());
    const fileRef = ref(storage, `${bucket}/${filePath}`);
    await deleteObject(fileRef);

    return {
      success: true,
      message: "File deleted successfully",
    };
  } catch (error: any) {
    console.error("File deletion error:", error);
    return {
      success: false,
      error: error.message || "Deletion failed",
    };
  }
}

/**
 * Gets a signed URL for private files
 */
export async function getSignedUrl(
  bucket: string,
  filePath: string,
  expiresIn: number = 3600
): Promise<{ url?: string; error?: string }> {
  try {
    if (!useFirebase()) {
      throw new Error("Firebase storage is required");
    }
    const storage = getStorage(getFirebaseApp());
    const storageRef = ref(storage, `${bucket}/${filePath}`);
    const url = await getDownloadURL(storageRef);
    return { url };
  } catch (error: any) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to get signed URL",
    };
  }
}

/**
 * Lists files in a Firebase Storage folder
 * @param bucket - The storage bucket name
 * @param folder - The folder path within the bucket
 * @returns Promise with file list
 */
export async function listFiles(
  bucket: string,
  folder: string = ""
): Promise<FileListResult> {
  try {
    if (!useFirebase()) {
      throw new Error("Firebase storage is required");
    }

    const storage = getStorage(getFirebaseApp());
    const folderRef = ref(storage, `${bucket}/${folder}`);
    const result = await listAll(folderRef);

    const files = await Promise.all(
      result.items.map(async (item) => {
        try {
          const url = await getDownloadURL(item);
          const metadata = await getMetadata(item);
          
          return {
            name: item.name,
            path: item.fullPath,
            url,
            size: metadata.size || 0,
            type: metadata.contentType || "unknown",
            created_at: metadata.timeCreated,
            metadata: {
              contentType: metadata.contentType,
              size: metadata.size,
              timeCreated: metadata.timeCreated,
              customMetadata: metadata.customMetadata,
            }
          };
        } catch (error) {
          console.warn(`Failed to get metadata for ${item.name}:`, error);
          return {
            name: item.name,
            path: item.fullPath,
            url: "",
            size: 0,
            type: "unknown",
            metadata: {}
          };
        }
      })
    );

    return {
      success: true,
      files,
    };
  } catch (error: any) {
    console.error("File listing error:", error);
    return {
      success: false,
      error: error.message || "Listing failed",
      files: [],
    };
  }
}
