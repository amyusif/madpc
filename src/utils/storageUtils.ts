// Shared file storage utilities (no Firebase dependency)

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

// Storage folder paths
export const STORAGE_FOLDERS = {
  PERSONNEL_PHOTOS: "personnel/photos",
  USER_PROFILES: "users/profiles",
  CASE_EVIDENCE: "cases/evidence",
  DOCUMENTS: "documents",
  REPORTS: "reports",
} as const;

// Bucket-style constants kept for backward compatibility
export const STORAGE_BUCKETS = {
  USER_PROFILES: "users/profiles",
  PERSONNEL_PHOTOS: "personnel/photos",
  CASE_EVIDENCE: "cases/evidence",
  DOCUMENTS: "documents",
  REPORTS: "reports",
  IMPORTS: "imports",
} as const;

// File type configurations
export const FILE_CONFIGS = {
  IMAGES: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ["image/jpeg", "image/jpg", "image/png", "image/webp"] as readonly string[],
    extensions: [".jpg", ".jpeg", ".png", ".webp"] as readonly string[],
  },
  DOCUMENTS: {
    maxSize: 16 * 1024 * 1024, // 16MB
    allowedTypes: [
      "application/pdf",
      "text/plain",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ] as readonly string[],
    extensions: [".pdf", ".txt", ".doc", ".docx"] as readonly string[],
  },
  VIDEOS: {
    maxSize: 64 * 1024 * 1024, // 64MB
    allowedTypes: ["video/mp4", "video/webm", "video/ogg"] as readonly string[],
    extensions: [".mp4", ".webm", ".ogg"] as readonly string[],
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
    ] as readonly string[],
    extensions: [".jpg", ".jpeg", ".png", ".webp", ".pdf", ".mp4", ".webm", ".mp3", ".wav"] as readonly string[],
  },
  SPREADSHEETS: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: [
      "text/csv",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ] as readonly string[],
    extensions: [".csv", ".xls", ".xlsx"] as readonly string[],
  },
} as const;

/**
 * Validates a file against the provided configuration
 */
export function validateFile(
  file: File,
  config: { maxSize: number; allowedTypes: readonly string[]; extensions: readonly string[] }
): { isValid: boolean; error?: string } {
  if (file.size > config.maxSize) {
    const maxSizeMB = (config.maxSize / (1024 * 1024)).toFixed(1);
    return { isValid: false, error: `File size must be less than ${maxSizeMB}MB` };
  }

  if (config.allowedTypes.length > 0 && !config.allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `File type not allowed. Supported: ${config.extensions.join(", ")}`,
    };
  }

  return { isValid: true };
}

/**
 * Generates a unique filename with timestamp and random string
 */
export function generateUniqueFileName(originalName: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const lastDot = originalName.lastIndexOf(".");
  if (lastDot === -1) return `${originalName}_${timestamp}_${random}`;
  const ext = originalName.substring(lastDot);
  const base = originalName.substring(0, lastDot).replace(/[^a-zA-Z0-9]/g, "_");
  return `${base}_${timestamp}_${random}${ext}`;
}
