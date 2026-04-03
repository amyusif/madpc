import { NextRequest, NextResponse } from 'next/server';
import { del } from '@vercel/blob';

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fileUrl = searchParams.get('url') || searchParams.get('path');

    if (!fileUrl) {
      return NextResponse.json({ success: false, error: 'File URL is required' }, { status: 400 });
    }

    await del(fileUrl);

    return NextResponse.json({ success: true, message: 'File deleted successfully' });
  } catch (error) {
    console.error('Delete API error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { filePath, fileUrl } = await request.json();
    const target = fileUrl || filePath;

    if (!target) {
      return NextResponse.json({ success: false, error: 'File URL is required' }, { status: 400 });
    }

    await del(target);

    return NextResponse.json({ success: true, message: 'File deleted successfully' });
  } catch (error) {
    console.error('Delete API error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

