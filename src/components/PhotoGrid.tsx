'use client';

import type { PhotoItem } from '@/lib/types';

type PhotoGridProps = {
  photos: PhotoItem[];
  onDelete: (photoId: string) => void;
  onMoveUp: (photoId: string) => void;
  onMoveDown: (photoId: string) => void;
  onToggleFeatured: (photoId: string) => void;
  onCaptionChange: (photoId: string, caption: string) => void;
};

export default function PhotoGrid({
  photos,
  onDelete,
  onMoveUp,
  onMoveDown,
  onToggleFeatured,
  onCaptionChange,
}: PhotoGridProps) {
  if (photos.length === 0) {
    return null;
  }

  const getStatusIcon = (status: PhotoItem['uploadStatus']) => {
    switch (status) {
      case 'success':
        return (
          <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        );
      case 'uploading':
        return (
          <svg
            className="w-5 h-5 text-blue-600 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-4 sm:p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">
        Photos ({photos.length})
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {photos.map((photo, index) => (
          <div
            key={photo.id}
            className={`relative border-2 rounded-lg overflow-hidden ${
              photo.isFeatured ? 'border-yellow-400' : 'border-gray-200'
            }`}
          >
            {/* Featured Badge */}
            {photo.isFeatured && (
              <div className="absolute top-2 left-2 z-10 bg-yellow-400 text-yellow-900 px-2 py-1 rounded text-xs font-semibold">
                ⭐ Featured
              </div>
            )}

            {/* Status Icon */}
            <div className="absolute top-2 right-2 z-10 bg-white rounded-full p-1">
              {getStatusIcon(photo.uploadStatus)}
            </div>

            {/* Photo Thumbnail */}
            <div className="aspect-square bg-gray-100">
              <img
                src={photo.thumbnail}
                alt={photo.caption || `Photo ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Controls */}
            <div className="p-3 bg-gray-50">
              {/* Caption Input */}
              <input
                type="text"
                placeholder="Add caption (optional)"
                value={photo.caption || ''}
                onChange={(e) => onCaptionChange(photo.id, e.target.value)}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded mb-2 focus:ring-1 focus:ring-blue-500"
                disabled={photo.uploadStatus === 'uploading'}
              />

              {/* Error Message */}
              {photo.error && (
                <p className="text-xs text-red-600 mb-2">{photo.error}</p>
              )}

              {/* Action Buttons */}
              <div className="flex gap-1">
                {/* Move Up */}
                <button
                  onClick={() => onMoveUp(photo.id)}
                  disabled={index === 0 || photo.uploadStatus === 'uploading'}
                  className="flex-1 px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 rounded"
                  title="Move up"
                >
                  ↑
                </button>

                {/* Move Down */}
                <button
                  onClick={() => onMoveDown(photo.id)}
                  disabled={index === photos.length - 1 || photo.uploadStatus === 'uploading'}
                  className="flex-1 px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 rounded"
                  title="Move down"
                >
                  ↓
                </button>

                {/* Toggle Featured */}
                <button
                  onClick={() => onToggleFeatured(photo.id)}
                  disabled={photo.uploadStatus === 'uploading'}
                  className={`flex-1 px-2 py-1 text-xs rounded ${
                    photo.isFeatured
                      ? 'bg-yellow-400 text-yellow-900'
                      : 'bg-gray-200 hover:bg-yellow-100'
                  }`}
                  title="Set as featured"
                >
                  ⭐
                </button>

                {/* Delete */}
                <button
                  onClick={() => onDelete(photo.id)}
                  disabled={photo.uploadStatus === 'uploading'}
                  className="flex-1 px-2 py-1 text-xs bg-red-500 text-white hover:bg-red-600 disabled:bg-gray-300 rounded"
                  title="Delete"
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="text-sm text-gray-500 mt-4">
        Tip: The first photo (or starred photo) will be the featured image in WooCommerce
      </p>
    </div>
  );
}
