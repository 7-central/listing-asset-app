'use client';

import { useState } from 'react';
import ProductSearcher from '@/components/ProductSearcher';
import PhotoCapture from '@/components/PhotoCapture';
import PhotoGrid from '@/components/PhotoGrid';
import type { DraftProduct, PhotoItem } from '@/lib/types';
import {
  validateImageFile,
  compressImage,
  generateThumbnail,
} from '@/lib/imageUtils';

export default function PhotosPage() {
  const [selectedProduct, setSelectedProduct] = useState<DraftProduct | null>(null);
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Handle product selection
  const handleProductSelect = (product: DraftProduct) => {
    setSelectedProduct(product);
    setPhotos([]); // Clear photos when switching products
    setError('');
    setSuccess('');
  };

  // Handle new photos captured/selected
  const handlePhotosSelected = async (files: File[]) => {
    setError('');

    const newPhotos: PhotoItem[] = [];

    for (const file of files) {
      // Validate file
      const validation = validateImageFile(file);
      if (!validation.valid) {
        setError(validation.error || 'Invalid file');
        continue;
      }

      try {
        // Compress image
        const compressedFile = await compressImage(file);

        // Generate thumbnail
        const thumbnail = await generateThumbnail(compressedFile);

        // Create photo item
        const photoItem: PhotoItem = {
          id: `photo-${Date.now()}-${Math.random()}`,
          file: compressedFile,
          thumbnail,
          orderIndex: photos.length + newPhotos.length,
          uploadStatus: 'pending',
        };

        newPhotos.push(photoItem);
      } catch (err) {
        console.error('Error processing file:', err);
        setError(`Failed to process ${file.name}`);
      }
    }

    setPhotos([...photos, ...newPhotos]);
  };

  // Handle photo deletion
  const handleDeletePhoto = (photoId: string) => {
    setPhotos(photos.filter((p) => p.id !== photoId));
  };

  // Handle move up
  const handleMoveUp = (photoId: string) => {
    const index = photos.findIndex((p) => p.id === photoId);
    if (index <= 0) return;

    const newPhotos = [...photos];
    [newPhotos[index - 1], newPhotos[index]] = [newPhotos[index], newPhotos[index - 1]];

    // Update order indices
    newPhotos.forEach((p, i) => (p.orderIndex = i));
    setPhotos(newPhotos);
  };

  // Handle move down
  const handleMoveDown = (photoId: string) => {
    const index = photos.findIndex((p) => p.id === photoId);
    if (index < 0 || index >= photos.length - 1) return;

    const newPhotos = [...photos];
    [newPhotos[index], newPhotos[index + 1]] = [newPhotos[index + 1], newPhotos[index]];

    // Update order indices
    newPhotos.forEach((p, i) => (p.orderIndex = i));
    setPhotos(newPhotos);
  };

  // Handle toggle featured
  const handleToggleFeatured = (photoId: string) => {
    setPhotos(
      photos.map((p) => ({
        ...p,
        isFeatured: p.id === photoId ? !p.isFeatured : false, // Only one can be featured
      }))
    );
  };

  // Handle caption change
  const handleCaptionChange = (photoId: string, caption: string) => {
    setPhotos(photos.map((p) => (p.id === photoId ? { ...p, caption } : p)));
  };

  // Handle upload all photos
  const handleUpload = async () => {
    if (!selectedProduct) {
      setError('Please select a product first');
      return;
    }

    if (photos.length === 0) {
      setError('Please add at least one photo');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');

    const uploadedMediaIds: number[] = [];
    let featuredMediaId: number | undefined;

    try {
      // Upload each photo
      for (const photo of photos) {
        // Update status to uploading
        setPhotos((prev) =>
          prev.map((p) =>
            p.id === photo.id ? { ...p, uploadStatus: 'uploading' } : p
          )
        );

        try {
          // Upload to server
          const formData = new FormData();
          formData.append('file', photo.file);
          if (photo.caption) {
            formData.append('caption', photo.caption);
          }

          const response = await fetch('/api/photos/upload', {
            method: 'POST',
            body: formData,
          });

          const data = await response.json();

          if (data.ok) {
            // Mark as success
            setPhotos((prev) =>
              prev.map((p) =>
                p.id === photo.id
                  ? {
                      ...p,
                      uploadStatus: 'success',
                      blobUrl: data.blobUrl,
                      wooMediaId: data.wooMediaId,
                      wooImageUrl: data.wooImageUrl,
                    }
                  : p
              )
            );

            uploadedMediaIds.push(data.wooMediaId);

            // Track featured image
            if (photo.isFeatured) {
              featuredMediaId = data.wooMediaId;
            }
          } else {
            throw new Error(data.error || 'Upload failed');
          }
        } catch (err: unknown) {
          const errorMessage = err instanceof Error ? err.message : 'Upload failed';

          // Mark as error
          setPhotos((prev) =>
            prev.map((p) =>
              p.id === photo.id
                ? { ...p, uploadStatus: 'error', error: errorMessage }
                : p
            )
          );

          throw err; // Stop upload process on error
        }
      }

      // If no featured image selected, use first image
      if (!featuredMediaId && uploadedMediaIds.length > 0) {
        featuredMediaId = uploadedMediaIds[0];
      }

      // Attach all images to product
      const attachResponse = await fetch('/api/photos/attach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProduct.id,
          imageIds: uploadedMediaIds,
          featuredImageId: featuredMediaId,
        }),
      });

      const attachData = await attachResponse.json();

      if (attachData.ok) {
        setSuccess(
          `Successfully uploaded ${uploadedMediaIds.length} photo(s) to "${selectedProduct.name}"!`
        );

        // Clear photos after successful upload
        setTimeout(() => {
          setPhotos([]);
          setSuccess('');
        }, 3000);
      } else {
        throw new Error(attachData.error || 'Failed to attach images to product');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(`Upload error: ${errorMessage}`);
    } finally {
      setUploading(false);
    }
  };

  const hasPhotos = photos.length > 0;
  const allPhotosUploaded = photos.every((p) => p.uploadStatus === 'success');
  const hasErrors = photos.some((p) => p.uploadStatus === 'error');

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-12">
      <div className="mx-auto max-w-6xl px-4">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Photo Manager
          </h1>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
            <p className="text-green-700">{success}</p>
          </div>
        )}

        {/* Product Searcher */}
        <div className="mb-6">
          <ProductSearcher
            onProductSelect={handleProductSelect}
            selectedProductId={selectedProduct?.id || null}
          />
        </div>

        {/* Selected Product Header */}
        {selectedProduct && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-600 font-medium">Selected Product:</p>
            <p className="text-lg font-bold text-blue-900">{selectedProduct.name}</p>
            <p className="text-sm text-blue-600">ID: {selectedProduct.id}</p>
          </div>
        )}

        {/* Photo Capture (only show if product selected) */}
        {selectedProduct && (
          <div className="mb-6">
            <PhotoCapture
              onPhotosSelected={handlePhotosSelected}
              disabled={uploading}
            />
          </div>
        )}

        {/* Photo Grid */}
        {hasPhotos && (
          <>
            <div className="mb-6">
              <PhotoGrid
                photos={photos}
                onDelete={handleDeletePhoto}
                onMoveUp={handleMoveUp}
                onMoveDown={handleMoveDown}
                onToggleFeatured={handleToggleFeatured}
                onCaptionChange={handleCaptionChange}
              />
            </div>

            {/* Upload Button */}
            <div className="bg-white shadow rounded-lg p-6">
              <button
                onClick={handleUpload}
                disabled={uploading || allPhotosUploaded}
                className="w-full bg-green-600 text-white py-4 px-6 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-bold text-lg transition"
              >
                {uploading
                  ? 'Uploading...'
                  : allPhotosUploaded
                  ? 'All Photos Uploaded ✓'
                  : `Upload ${photos.length} Photo${photos.length !== 1 ? 's' : ''} to WooCommerce`}
              </button>

              {hasErrors && !uploading && (
                <p className="text-sm text-red-600 mt-2 text-center">
                  Some uploads failed. Please retry.
                </p>
              )}
            </div>
          </>
        )}

        {/* Info Box (when no product selected) */}
        {!selectedProduct && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-6">
            <h3 className="font-semibold text-blue-900 mb-2">How to use:</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
              <li>Select a draft product from the list above</li>
              <li>Take photos using your camera or choose from library</li>
              <li>Review photos, reorder, add captions, and set featured image</li>
              <li>Click "Upload to WooCommerce" to attach photos to the product</li>
              <li>Photos will be automatically attached in the correct order</li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}
