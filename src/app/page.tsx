'use client';

import { useState } from 'react';
import { ListingInput, ListingAssets, WooVariationAttribute } from '@/lib/types';
import VariationsBuilder from './components/VariationsBuilder';
import WooCategoriesAndTags from './components/WooCategoriesAndTags';

export default function Home() {
  const [formData, setFormData] = useState<ListingInput>({
    productName: '',
    whatIsIt: '',
    whoIsItFor: '',
    variations: '',
    personalisation: '',
    priceNotes: '',
    postageNotes: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assets, setAssets] = useState<ListingAssets | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // WooCommerce integration state
  const [variationsEnabled, setVariationsEnabled] = useState(true);
  const [variationAttributes, setVariationAttributes] = useState<WooVariationAttribute[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [uploadingToWoo, setUploadingToWoo] = useState(false);
  const [wooSuccess, setWooSuccess] = useState<{
    productId: number;
    permalink: string;
    adminEditUrl: string;
  } | null>(null);
  const [wooError, setWooError] = useState<{ error: string; details?: any } | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handleInputChange = (field: keyof ListingInput) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleClear = () => {
    setFormData({
      productName: '',
      whatIsIt: '',
      whoIsItFor: '',
      variations: '',
      personalisation: '',
      priceNotes: '',
      postageNotes: '',
    });
    setAssets(null);
    setError(null);
  };

  const handleCopy = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setAssets(null);

    try {
      const response = await fetch('/api/generate-listing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.ok) {
        setAssets(result.assets);
      } else {
        setError(result.error || 'An error occurred');
      }
    } catch {
      setError('Network error: Unable to connect to the server');
    } finally {
      setLoading(false);
    }
  };

  const isReadyForWooUpload = (): boolean => {
    if (!assets?.title || !assets?.description) return false;
    if (variationsEnabled && variationAttributes.length === 0) return false;
    if (variationsEnabled) {
      for (const attr of variationAttributes) {
        if (attr.options.length === 0) return false;
      }
    }
    return true;
  };

  const handleUploadToWoo = () => {
    setShowConfirmModal(true);
  };

  const confirmUploadToWoo = async () => {
    setShowConfirmModal(false);
    setUploadingToWoo(true);
    setWooError(null);
    setWooSuccess(null);

    try {
      const payload = {
        name: assets!.title,
        description: assets!.description,
        short_description: assets!.personalisationShort || '',
        variationAttributes: variationsEnabled ? variationAttributes : [],
        categoryIds: selectedCategoryIds,
        tagIds: selectedTagIds,
      };

      const response = await fetch('/api/woocommerce/create-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.ok) {
        setWooSuccess({
          productId: result.productId,
          permalink: result.permalink,
          adminEditUrl: result.adminEditUrl,
        });
      } else {
        setWooError({
          error: result.error || 'Failed to upload to WooCommerce',
          details: result.details,
        });
      }
    } catch (error) {
      setWooError({
        error: 'Network error: Unable to connect to WooCommerce',
      });
    } finally {
      setUploadingToWoo(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-12">
      <div className="mx-auto max-w-4xl px-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 sm:mb-8">Listing Asset Generator</h1>

        <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="space-y-6">
            <div>
              <label htmlFor="productName" className="block text-sm font-medium text-gray-700 mb-2">
                Product Name *
              </label>
              <input
                type="text"
                id="productName"
                required
                value={formData.productName}
                onChange={handleInputChange('productName')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="whatIsIt" className="block text-sm font-medium text-gray-700 mb-2">
                What is this product? *
              </label>
              <textarea
                id="whatIsIt"
                required
                rows={3}
                value={formData.whatIsIt}
                onChange={handleInputChange('whatIsIt')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Describe the product in plain language"
              />
            </div>

            <div>
              <label htmlFor="whoIsItFor" className="block text-sm font-medium text-gray-700 mb-2">
                Who is it for / what occasions? *
              </label>
              <textarea
                id="whoIsItFor"
                required
                rows={3}
                value={formData.whoIsItFor}
                onChange={handleInputChange('whoIsItFor')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Target audience and use cases"
              />
            </div>

            <div>
              <label htmlFor="variations" className="block text-sm font-medium text-gray-700 mb-2">
                What variations are available? *
              </label>
              <textarea
                id="variations"
                required
                rows={3}
                value={formData.variations}
                onChange={handleInputChange('variations')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., colour, size, material options"
              />
            </div>

            <div>
              <label htmlFor="personalisation" className="block text-sm font-medium text-gray-700 mb-2">
                Does it allow personalisation? If yes, what exactly can be personalised? *
              </label>
              <textarea
                id="personalisation"
                required
                rows={3}
                value={formData.personalisation}
                onChange={handleInputChange('personalisation')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Personalisation options or 'None'"
              />
            </div>

            <div>
              <label htmlFor="priceNotes" className="block text-sm font-medium text-gray-700 mb-2">
                Price Notes (optional)
              </label>
              <textarea
                id="priceNotes"
                rows={2}
                value={formData.priceNotes}
                onChange={handleInputChange('priceNotes')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Any pricing information or notes"
              />
            </div>

            <div>
              <label htmlFor="postageNotes" className="block text-sm font-medium text-gray-700 mb-2">
                Postage Notes (optional)
              </label>
              <textarea
                id="postageNotes"
                rows={2}
                value={formData.postageNotes}
                onChange={handleInputChange('postageNotes')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Shipping or postage information"
              />
            </div>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-2 px-4 text-sm sm:text-base rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Generating...' : 'Generate Listing Assets'}
            </button>
            <button
              type="button"
              onClick={handleClear}
              disabled={loading}
              className="px-6 py-2 text-sm sm:text-base border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              Clear Form
            </button>
          </div>
        </form>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 sm:p-4 mb-4 sm:mb-6">
            <div className="flex">
              <div className="text-red-700 text-sm sm:text-base">
                <strong>Error:</strong> {error}
              </div>
            </div>
          </div>
        )}

        {assets && (
          <div className="bg-white shadow rounded-lg p-4 sm:p-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Generated Listing Assets</h2>

            <div className="space-y-4 sm:space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-700">Title</h3>
                  <button
                    onClick={() => handleCopy(assets.title, 'title')}
                    className="flex items-center gap-1 px-2 sm:px-3 py-1 text-xs sm:text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
                  >
                    {copiedField === 'title' ? (
                      <>
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Copied!
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Copy
                      </>
                    )}
                  </button>
                </div>
                <p className="bg-gray-50 p-3 rounded border">{assets.title}</p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-700">Description</h3>
                  <button
                    onClick={() => handleCopy(assets.description, 'description')}
                    className="flex items-center gap-1 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
                  >
                    {copiedField === 'description' ? (
                      <>
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Copied!
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Copy
                      </>
                    )}
                  </button>
                </div>
                <div className="bg-gray-50 p-3 rounded border whitespace-pre-wrap">{assets.description}</div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-700">Key Features</h3>
                  <button
                    onClick={() => handleCopy(assets.keyFeatures.join('\n'), 'keyFeatures')}
                    className="flex items-center gap-1 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
                  >
                    {copiedField === 'keyFeatures' ? (
                      <>
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Copied!
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Copy
                      </>
                    )}
                  </button>
                </div>
                <ul className="bg-gray-50 p-3 rounded border list-disc list-inside">
                  {assets.keyFeatures.map((feature, index) => (
                    <li key={index}>{feature}</li>
                  ))}
                </ul>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-700">Tags</h3>
                  <button
                    onClick={() => handleCopy(assets.tags.join(', '), 'tags')}
                    className="flex items-center gap-1 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
                  >
                    {copiedField === 'tags' ? (
                      <>
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Copied!
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Copy
                      </>
                    )}
                  </button>
                </div>
                <div className="bg-gray-50 p-3 rounded border">
                  {assets.tags.join(', ')}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-700">Personalisation (Short)</h3>
                  <button
                    onClick={() => handleCopy(assets.personalisationShort, 'personalisationShort')}
                    className="flex items-center gap-1 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
                  >
                    {copiedField === 'personalisationShort' ? (
                      <>
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Copied!
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Copy
                      </>
                    )}
                  </button>
                </div>
                <p className="bg-gray-50 p-3 rounded border">{assets.personalisationShort}</p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-700">Personalisation (Long)</h3>
                  <button
                    onClick={() => handleCopy(assets.personalisationLong, 'personalisationLong')}
                    className="flex items-center gap-1 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
                  >
                    {copiedField === 'personalisationLong' ? (
                      <>
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Copied!
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Copy
                      </>
                    )}
                  </button>
                </div>
                <div className="bg-gray-50 p-3 rounded border whitespace-pre-wrap">{assets.personalisationLong}</div>
              </div>
            </div>
          </div>
        )}

        {assets && (
          <div className="bg-white shadow rounded-lg p-4 sm:p-6 mt-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">
              WooCommerce Upload Settings
            </h2>

            <div className="space-y-6">
              {/* Variations Builder */}
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-3">Variations</h3>
                <VariationsBuilder
                  enabled={variationsEnabled}
                  onEnabledChange={setVariationsEnabled}
                  attributes={variationAttributes}
                  onAttributesChange={setVariationAttributes}
                />
              </div>

              {/* WooCommerce Categories & Tags */}
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-3">Categories & Tags</h3>
                <WooCategoriesAndTags
                  selectedCategoryIds={selectedCategoryIds}
                  selectedTagIds={selectedTagIds}
                  onCategoriesChange={setSelectedCategoryIds}
                  onTagsChange={setSelectedTagIds}
                />
              </div>

              {/* Upload Button */}
              <div className="pt-4 border-t">
                <button
                  onClick={handleUploadToWoo}
                  disabled={!isReadyForWooUpload() || uploadingToWoo}
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
                >
                  {uploadingToWoo ? 'Uploading to WooCommerce...' : 'Upload to Woo Draft'}
                </button>
                {!isReadyForWooUpload() && !uploadingToWoo && (
                  <p className="text-sm text-gray-600 mt-2">
                    {!assets?.title || !assets?.description
                      ? 'Generate listing assets first'
                      : 'Please ensure all variation attributes have at least one value'}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Success Message */}
        {wooSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4 sm:p-6 mt-6">
            <div className="flex items-start">
              <svg
                className="w-6 h-6 text-green-600 mr-3 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-green-900 mb-2">
                  Successfully uploaded to WooCommerce!
                </h3>
                <div className="space-y-2 text-sm text-green-800">
                  <p>
                    <strong>Product ID:</strong> {wooSuccess.productId}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2 mt-3">
                    <a
                      href={wooSuccess.adminEditUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                      Edit in WooCommerce Admin
                      <svg
                        className="w-4 h-4 ml-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                    </a>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(wooSuccess.adminEditUrl);
                      }}
                      className="inline-flex items-center px-4 py-2 bg-white border border-green-600 text-green-600 rounded-md hover:bg-green-50"
                    >
                      Copy Admin Link
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {wooError && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 sm:p-6 mt-6">
            <div className="flex">
              <svg
                className="w-6 h-6 text-red-600 mr-3 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-red-900 mb-2">Upload Failed</h3>
                <p className="text-sm text-red-800 mb-2">{wooError.error}</p>
                {wooError.details && (
                  <details className="text-sm text-red-700 mt-2">
                    <summary className="cursor-pointer font-medium">Technical Details</summary>
                    <pre className="mt-2 p-3 bg-red-100 rounded overflow-x-auto">
                      {JSON.stringify(wooError.details, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Modal */}
        {showConfirmModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Confirm Upload</h3>
              <p className="text-gray-700 mb-6">
                Create a new draft product in WooCommerce using the current content?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={confirmUploadToWoo}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700"
                >
                  Yes, Upload
                </button>
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}