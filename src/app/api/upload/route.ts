import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { FILE_CONFIGS, STORAGE_FOLDERS, validateFile, generateUniqueFileName } from '@/utils/storageUtils';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const uploadType = formData.get('type') as string;
    const folder = formData.get('folder') as string;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    if (!uploadType) {
      return NextResponse.json({ success: false, error: 'Upload type is required' }, { status: 400 });
    }

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
        config = FILE_CONFIGS.IMAGES;
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
        return NextResponse.json({ success: false, error: 'Invalid upload type' }, { status: 400 });
    }

    const validation = validateFile(file, config);
    if (!validation.isValid) {
      return NextResponse.json({ success: false, error: validation.error }, { status: 400 });
    }

    const fileName = generateUniqueFileName(file.name);
    const blobPath = `${targetFolder}/${fileName}`;

    const blob = await put(blobPath, file, { access: 'public' });

    return NextResponse.json({
      success: true,
      file: {
        url: blob.url,
        path: blobPath,
        size: file.size,
        type: file.type,
      },
    });
  } catch (error) {
    console.error('Upload API error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
