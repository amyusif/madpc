import { supabase } from "@/integrations/supabase/client";
import { getFirebaseApp } from "@/integrations/firebase/client";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject, listAll, getMetadata } from "firebase/storage";

const useFirebase = () => (process.env.NEXT_PUBLIC_USE_FIRESTORE || "").toString() === "true";

export interface FileUploadOptions {
  bucket: string;
  folder?: string;
  maxSize?: number; // in bytes
  allowedTypes?: readonly string[];
  generateUniqueName?: boolean;
}

export interface FileUploadResult {
  success: boolean;
  url?: string;
  path?: string;
  error?: string;
  size?: number;
  type?: string;
}

export interface FileDeleteResult {
  success: boolean;
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
 * Uploads a file to storage (Firebase when enabled, otherwise Supabase)
 */
export async function uploadFile(
  file: File,
  options: FileUploadOptions
): Promise<FileUploadResult> {
  try {
    // Validate file if config provided
    if (options.allowedTypes || options.maxSize) {
      const config = {
        maxSize: options.maxSize || 10 * 1024 * 1024,
        allowedTypes: (options.allowedTypes as readonly string[]) || [],
        extensions: [] as readonly string[],
      } as const;

      const validation = validateFile(file, config);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error,
        };
      }
    }

    // Generate file path
    const fileName = options.generateUniqueName
      ? generateUniqueFileName(file.name)
      : file.name;

    const filePath = options.folder
      ? `${options.folder}/${fileName}`
      : fileName;

    if (useFirebase()) {
      const storage = getStorage(getFirebaseApp());
      const storageRef = ref(storage, `${options.bucket}/${filePath}`);
      const snapshot = await uploadBytes(storageRef, file, { contentType: file.type });
      const url = await getDownloadURL(snapshot.ref);
      return { success: true, url, path: filePath, size: file.size, type: file.type };
    }

    // Supabase fallback
    const { data, error } = await supabase.storage
      .from(options.bucket)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    const { data: urlData } = supabase.storage
      .from(options.bucket)
      .getPublicUrl(filePath);

    return {
      success: true,
      url: urlData.publicUrl,
      path: filePath,
      size: file.size,
      type: file.type,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Upload failed",
    };
  }
}

/**
 * Deletes a file from storage
 */
export async function deleteFile(
  bucket: string,
  filePath: string
): Promise<FileDeleteResult> {
  try {
    if (useFirebase()) {
      const storage = getStorage(getFirebaseApp());
      const storageRef = ref(storage, `${bucket}/${filePath}`);
      await deleteObject(storageRef);
      return { success: true };
    }

    const { error } = await supabase.storage.from(bucket).remove([filePath]);

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Delete failed",
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
    if (useFirebase()) {
      // Firebase download URLs are already signed, just return it
      const storage = getStorage(getFirebaseApp());
      const storageRef = ref(storage, `${bucket}/${filePath}`);
      const url = await getDownloadURL(storageRef);
      return { url };
    }

    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(filePath, expiresIn);

    if (error) {
      return { error: error.message };
    }

    return { url: data.signedUrl };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to get signed URL",
    };
  }
}

/**
 * Lists files in a storage bucket folder
 */
export async function listFiles(
  bucket: string,
  folder?: string,
  limit: number = 100
) {
  try {
    if (useFirebase()) {
      const storage = getStorage(getFirebaseApp());
      const safeFolder = folder ? folder.replace(/^\/+|\/+$/g, "") : "";
      const basePath = safeFolder ? `${bucket}/${safeFolder}` : bucket;
      const dirRef = ref(storage, basePath);
      const res = await listAll(dirRef);
      const files = await Promise.all(
        res.items.slice(0, limit).map(async (itemRef) => {
          const url = await getDownloadURL(itemRef);
          const meta = await getMetadata(itemRef).catch(() => undefined);
          return {
            name: itemRef.name,
            created_at: meta?.timeCreated,
            metadata: { mimetype: meta?.contentType, size: meta?.size },
            url,
          } as any;
        })
      );
      return { files, error: null };
    }

    const { data, error } = await supabase.storage.from(bucket).list(folder, {
      limit,
      offset: 0,
    });

    if (error) {
      return { files: [], error: error.message };
    }

    return { files: data || [], error: null };
  } catch (error) {
    return {
      files: [],
      error: error instanceof Error ? error.message : "Failed to list files",
    };
  }
}
