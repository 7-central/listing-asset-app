/**
 * Vercel Blob Storage Integration
 * Handles photo upload and storage
 */

import { put, del, list } from '@vercel/blob';

export type BlobUploadResult = {
  url: string;
  pathname: string;
  contentType: string;
};

/**
 * Upload a file to Vercel Blob storage
 *
 * @param file - The file to upload
 * @param filename - Custom filename (optional, will use file.name if not provided)
 * @returns Upload result with URL and metadata
 */
export async function uploadToBlob(
  file: File | Buffer,
  filename?: string
): Promise<BlobUploadResult> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;

  if (!token) {
    throw new Error('BLOB_READ_WRITE_TOKEN environment variable is not set');
  }

  try {
    // Generate unique filename with timestamp to avoid collisions
    const timestamp = Date.now();
    const originalName = file instanceof File ? file.name : filename || 'image.jpg';
    const extension = originalName.split('.').pop() || 'jpg';
    const baseName = originalName.replace(/\.[^/.]+$/, '');
    const uniqueFilename = `${baseName}-${timestamp}.${extension}`;

    console.log('[Blob] Uploading file:', uniqueFilename);

    // Upload to Vercel Blob
    const blob = await put(uniqueFilename, file, {
      access: 'public',
      token: token,
    });

    console.log('[Blob] Upload successful:', blob.url);

    return {
      url: blob.url,
      pathname: blob.pathname,
      contentType: blob.contentType || 'image/jpeg',
    };
  } catch (error: unknown) {
    console.error('[Blob] Upload error:', error);
    throw new Error(
      `Failed to upload to Blob storage: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Delete a file from Vercel Blob storage
 *
 * @param url - The URL of the blob to delete
 */
export async function deleteFromBlob(url: string): Promise<void> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;

  if (!token) {
    throw new Error('BLOB_READ_WRITE_TOKEN environment variable is not set');
  }

  try {
    console.log('[Blob] Deleting file:', url);

    await del(url, { token });

    console.log('[Blob] Delete successful');
  } catch (error: unknown) {
    console.error('[Blob] Delete error:', error);
    throw new Error(
      `Failed to delete from Blob storage: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * List files in Blob storage with optional prefix filter
 *
 * @param prefix - Optional prefix to filter files (e.g., 'product-123/')
 * @returns Array of blob objects
 */
export async function listBlobFiles(prefix?: string) {
  const token = process.env.BLOB_READ_WRITE_TOKEN;

  if (!token) {
    throw new Error('BLOB_READ_WRITE_TOKEN environment variable is not set');
  }

  try {
    const result = await list({
      token,
      prefix,
    });

    return result.blobs;
  } catch (error: unknown) {
    console.error('[Blob] List error:', error);
    throw new Error(
      `Failed to list Blob storage: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Validate blob storage configuration
 *
 * @returns true if configured correctly
 */
export function isBlobConfigured(): boolean {
  return !!process.env.BLOB_READ_WRITE_TOKEN;
}
