/**
 * Client-side Image Processing Utilities
 * Handles compression, validation, and thumbnail generation
 */

import imageCompression from 'browser-image-compression';

/**
 * Supported image file types
 */
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

/**
 * Maximum file size in MB
 */
const MAX_FILE_SIZE_MB = 15;

/**
 * Validate image file type and size
 *
 * @param file - File to validate
 * @returns Validation result
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  // Check file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: JPEG, PNG, WebP. Got: ${file.type}`,
    };
  }

  // Check file size (convert bytes to MB)
  const fileSizeMB = file.size / (1024 * 1024);
  if (fileSizeMB > MAX_FILE_SIZE_MB) {
    return {
      valid: false,
      error: `File too large. Maximum size: ${MAX_FILE_SIZE_MB}MB. File size: ${fileSizeMB.toFixed(2)}MB`,
    };
  }

  return { valid: true };
}

/**
 * Compress and resize image before upload
 *
 * @param file - Image file to compress
 * @param options - Compression options
 * @returns Compressed file
 */
export async function compressImage(
  file: File,
  options?: {
    maxSizeMB?: number;
    maxWidthOrHeight?: number;
    useWebWorker?: boolean;
  }
): Promise<File> {
  const defaultOptions = {
    maxSizeMB: 1, // Target file size
    maxWidthOrHeight: 2000, // Max dimension (long edge)
    useWebWorker: true, // Use web worker for better performance
    fileType: 'image/jpeg' as const, // Convert to JPEG
    initialQuality: 0.85, // JPEG quality
  };

  const compressionOptions = {
    ...defaultOptions,
    ...options,
  };

  try {
    console.log('[ImageUtils] Compressing image:', {
      originalSize: (file.size / (1024 * 1024)).toFixed(2) + 'MB',
      options: compressionOptions,
    });

    const compressedFile = await imageCompression(file, compressionOptions);

    console.log('[ImageUtils] Compression complete:', {
      originalSize: (file.size / (1024 * 1024)).toFixed(2) + 'MB',
      compressedSize: (compressedFile.size / (1024 * 1024)).toFixed(2) + 'MB',
      reduction: (((file.size - compressedFile.size) / file.size) * 100).toFixed(1) + '%',
    });

    return compressedFile;
  } catch (error: unknown) {
    console.error('[ImageUtils] Compression error:', error);
    throw new Error(
      `Failed to compress image: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Generate thumbnail from image file for preview
 *
 * @param file - Image file
 * @param maxSize - Maximum thumbnail dimension (default: 200px)
 * @returns Data URL of thumbnail
 */
export async function generateThumbnail(file: File, maxSize = 200): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        // Create canvas for thumbnail
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        // Calculate dimensions maintaining aspect ratio
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Draw image to canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to data URL
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };

      img.onerror = () => {
        reject(new Error('Failed to load image for thumbnail generation'));
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Get image dimensions without loading the full image
 *
 * @param file - Image file
 * @returns Image dimensions
 */
export async function getImageDimensions(
  file: File
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Convert File to Blob URL for temporary display
 *
 * @param file - File to convert
 * @returns Blob URL (remember to revoke when done: URL.revokeObjectURL(url))
 */
export function createBlobUrl(file: File): string {
  return URL.createObjectURL(file);
}

/**
 * Revoke blob URL to free memory
 *
 * @param url - Blob URL to revoke
 */
export function revokeBlobUrl(url: string): void {
  URL.revokeObjectURL(url);
}

/**
 * Format file size for display
 *
 * @param bytes - File size in bytes
 * @returns Formatted string (e.g., "2.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
