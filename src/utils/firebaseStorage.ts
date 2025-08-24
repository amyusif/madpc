import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';

// Initialize Firebase Admin if not already initialized
let storage: any;
let bucket: any;

try {
  if (!getApps().length) {
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;

    if (!projectId || !clientEmail || !privateKey || !storageBucket) {
      console.warn('Firebase credentials not configured. File upload will not work.');
      storage = null;
      bucket = null;
    } else {
      // Normalize bucket: Firebase console may show firebasestorage.app but Admin SDK expects appspot.com
      const normalizedBucket = storageBucket.includes('firebasestorage.app')
        ? `${projectId}.appspot.com`
        : storageBucket;

      initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        storageBucket: normalizedBucket,
      });
      storage = getStorage();
      bucket = storage.bucket();
    }
  } else {
    storage = getStorage();
    bucket = storage.bucket();
  }
} catch (error) {
  console.error('Failed to initialize Firebase Admin:', error);
  storage = null;
  bucket = null;
}

export interface FileUploadOptions {
  folder?: string;
  maxSize?: number; // in bytes
  allowedTypes?: readonly string[];
  generateUniqueName?: boolean;
  makePublic?: boolean;
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

// File type configurations
export const FILE_CONFIGS = {
  IMAGES: {
    maxSize: 4 * 1024 * 1024, // 4MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const,
    extensions: ['.jpg', '.jpeg', '.png', '.webp', '.gif'] as const,
  },
  DOCUMENTS: {
    maxSize: 16 * 1024 * 1024, // 16MB
    allowedTypes: ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'] as const,
    extensions: ['.pdf', '.txt', '.doc', '.docx'] as const,
  },
  VIDEOS: {
    maxSize: 64 * 1024 * 1024, // 64MB
    allowedTypes: ['video/mp4', 'video/webm', 'video/ogg'] as const,
    extensions: ['.mp4', '.webm', '.ogg'] as const,
  },
} as const;

// Storage folders
export const STORAGE_FOLDERS = {
  PERSONNEL_PHOTOS: 'personnel/photos',
  USER_PROFILES: 'users/profiles',
  CASE_EVIDENCE: 'cases/evidence',
  DOCUMENTS: 'documents',
  REPORTS: 'reports',
} as const;

/**
 * Validates a file against the provided configuration
 */
export function validateFile(
  file: File,
  config: {
    maxSize: number;
    allowedTypes: readonly string[];
    extensions: readonly string[];
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

  // Check file extension
  if (config.extensions.length > 0) {
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!config.extensions.includes(fileExtension as any)) {
      return {
        isValid: false,
        error: `File extension ${fileExtension} is not allowed`,
      };
    }
  }

  return { isValid: true };
}

/**
 * Generates a unique filename with timestamp and random string
 */
export function generateUniqueFileName(originalName: string): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const extension = originalName.split('.').pop();
  const nameWithoutExtension = originalName.replace(/\.[^/.]+$/, '');
  const sanitizedName = nameWithoutExtension.replace(/[^a-zA-Z0-9]/g, '_');
  
  return `${sanitizedName}_${timestamp}_${randomString}.${extension}`;
}

/**
 * Uploads a file to Google Cloud Storage
 */
export async function uploadFile(
  file: File,
  options: FileUploadOptions = {}
): Promise<FileUploadResult> {
  try {
    // Check if Firebase is configured
    if (!bucket) {
      return {
        success: false,
        error: 'Firebase Storage not configured. Please check your environment variables.',
      };
    }

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

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Firebase Storage
    const firebaseFile = bucket.file(filePath);

    await firebaseFile.save(buffer, {
      metadata: {
        contentType: file.type,
        metadata: {
          originalName: file.name,
          uploadedAt: new Date().toISOString(),
        },
      },
    });

    // Make file public if requested
    if (options.makePublic !== false) {
      await firebaseFile.makePublic();
    }

    // Get public URL - Firebase Storage format
    const encodedPath = encodeURIComponent(filePath);
    const publicUrl = `${process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BASE_URL}/${encodedPath}?alt=media`;

    return {
      success: true,
      url: publicUrl,
      path: filePath,
      size: file.size,
      type: file.type,
    };
  } catch (error) {
    console.error('Google Cloud Storage upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
}

/**
 * Deletes a file from Google Cloud Storage
 */
export async function deleteFile(filePath: string): Promise<FileDeleteResult> {
  try {
    // Check if Firebase is configured
    if (!bucket) {
      return {
        success: false,
        error: 'Firebase Storage not configured. Please check your environment variables.',
      };
    }

    const firebaseFile = bucket.file(filePath);
    await firebaseFile.delete();

    return {
      success: true,
    };
  } catch (error) {
    console.error('Firebase Storage delete error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Delete failed',
    };
  }
}

/**
 * Gets a signed URL for private file access
 */
export async function getSignedUrl(
  filePath: string,
  expiresInMinutes: number = 60
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const firebaseFile = bucket.file(filePath);

    const [signedUrl] = await firebaseFile.getSignedUrl({
      action: 'read',
      expires: Date.now() + expiresInMinutes * 60 * 1000,
    });

    return {
      success: true,
      url: signedUrl,
    };
  } catch (error) {
    console.error('Firebase Storage signed URL error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate signed URL',
    };
  }
}

/**
 * Lists files in a folder
 */
export async function listFiles(
  folder?: string
): Promise<{ success: boolean; files?: string[]; error?: string }> {
  try {
    const [files] = await bucket.getFiles({
      prefix: folder,
    });

    const fileNames = files.map((file: any) => file.name);

    return {
      success: true,
      files: fileNames,
    };
  } catch (error) {
    console.error('Firebase Storage list files error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list files',
    };
  }
}
