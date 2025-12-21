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

    // Determine proper file extension from MIME type or filename
    let extension = 'jpg'; // default

    if (file instanceof File && file.type) {
      // Use MIME type to determine extension (more reliable)
      const mimeType = file.type.toLowerCase();
      if (mimeType.includes('png')) extension = 'png';
      else if (mimeType.includes('jpeg') || mimeType.includes('jpg')) extension = 'jpg';
      else if (mimeType.includes('webp')) extension = 'webp';
      else if (mimeType.includes('gif')) extension = 'gif';
    } else {
      // Fallback to filename extension
      const fileExt = originalName.split('.').pop()?.toLowerCase() || 'jpg';
      // Only use it if it's a valid image extension
      if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(fileExt)) {
        extension = fileExt;
      }
    }

    // Create clean base name (remove extension and special chars)
    const baseName = originalName
      .replace(/\.[^/.]+$/, '') // remove extension
      .replace(/[^a-zA-Z0-9-_]/g, '-') // replace special chars with dash
      .replace(/-+/g, '-') // collapse multiple dashes
      .replace(/^-|-$/g, '') // trim dashes from ends
      .substring(0, 50) || 'image'; // limit length, default to 'image'

    const uniqueFilename = `${baseName}-${timestamp}.${extension}`;

    console.log('[Blob] Uploading file:', uniqueFilename);
    console.log('[Blob] MIME type:', file instanceof File ? file.type : 'Buffer');

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
