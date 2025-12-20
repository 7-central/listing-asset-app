/**
 * POST /api/photos/upload
 * Uploads photo to Vercel Blob and WooCommerce media library
 */

import { NextRequest, NextResponse } from 'next/server';
import { uploadToBlob } from '@/lib/blob';
import { uploadMediaToWooCommerce } from '@/lib/woocommerce';

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

    // Upload to Vercel Blob (for backup/reference)
    console.log('[Photos Upload] Uploading to Vercel Blob...');
    let blobUrl = '';
    try {
      const blobResult = await uploadToBlob(buffer, file.name);
      blobUrl = blobResult.url;
      console.log(`[Photos Upload] Blob upload successful: ${blobUrl}`);
    } catch (blobError: unknown) {
      console.error('[Photos Upload] Blob upload failed:', blobError);
      // Continue anyway - Blob is just backup, WooCommerce is primary
    }

    // Upload to WooCommerce media library (primary storage)
    console.log('[Photos Upload] Uploading to WooCommerce...');
    const wooMedia = await uploadMediaToWooCommerce(
      buffer,
      file.name,
      caption || undefined
    );

    console.log(`[Photos Upload] WooCommerce upload successful: ${wooMedia.src}`);

    return NextResponse.json({
      ok: true,
      blobUrl: blobUrl,
      wooMediaId: wooMedia.id,
      wooImageUrl: wooMedia.src,
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
