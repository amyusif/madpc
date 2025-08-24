import { NextRequest, NextResponse } from 'next/server';
import { uploadFile, FILE_CONFIGS, STORAGE_FOLDERS } from '@/utils/firebaseStorage';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const uploadType = formData.get('type') as string;
    const folder = formData.get('folder') as string;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!uploadType) {
      return NextResponse.json(
        { success: false, error: 'Upload type is required' },
        { status: 400 }
      );
    }

    // Determine upload configuration based on type
    let config;
    let targetFolder = folder;

    switch (uploadType) {
      case 'personnel-photo':
        config = FILE_CONFIGS.IMAGES;
        targetFolder = targetFolder || STORAGE_FOLDERS.PERSONNEL_PHOTOS;
        break;
      case 'user-profile':
        config = FILE_CONFIGS.IMAGES;
        targetFolder = targetFolder || STORAGE_FOLDERS.USER_PROFILES;
        break;
      case 'case-evidence':
        config = FILE_CONFIGS.IMAGES; // Can be extended to support videos/docs
        targetFolder = targetFolder || STORAGE_FOLDERS.CASE_EVIDENCE;
        break;
      case 'document':
        config = FILE_CONFIGS.DOCUMENTS;
        targetFolder = targetFolder || STORAGE_FOLDERS.DOCUMENTS;
        break;
      case 'report':
        config = FILE_CONFIGS.DOCUMENTS;
        targetFolder = targetFolder || STORAGE_FOLDERS.REPORTS;
        break;
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid upload type' },
          { status: 400 }
        );
    }

    // Upload file
    const result = await uploadFile(file, {
      folder: targetFolder,
      maxSize: config.maxSize,
      allowedTypes: config.allowedTypes,
      generateUniqueName: true,
      makePublic: true,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      file: {
        url: result.url,
        path: result.path,
        size: result.size,
        type: result.type,
      },
    });
  } catch (error) {
    console.error('Upload API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
