/**
 * POST /api/photos/upload
 * Uploads photo to Vercel Blob storage
 * WooCommerce will download the image from Blob URL when attaching to product
 */

import { NextRequest, NextResponse } from 'next/server';
import { uploadToBlob } from '@/lib/blob';

export async function POST(request: NextRequest) {
  try {
    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const caption = formData.get('caption') as string | null;

    if (!file) {
      return NextResponse.json(
        { ok: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    console.log(`[Photos Upload] Receiving file: ${file.name}, size: ${file.size} bytes`);

    // Convert File to Buffer for server-side processing
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Vercel Blob
    console.log('[Photos Upload] Uploading to Vercel Blob...');
    const blobResult = await uploadToBlob(buffer, file.name);
    console.log(`[Photos Upload] Blob upload successful: ${blobResult.url}`);

    return NextResponse.json({
      ok: true,
      imageUrl: blobResult.url,
      caption: caption || '',
      filename: file.name,
    });
  } catch (error: unknown) {
    console.error('[Photos Upload] Error:', error);

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error during upload';

    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to upload photo',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
