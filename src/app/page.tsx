'use client';

import { useState } from 'react';
import { ListingInput, ListingAssets } from '@/lib/types';

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

  const handleInputChange = (field: keyof ListingInput) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
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

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto max-w-4xl px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Listing Asset Generator</h1>
        
        <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 mb-8">
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

          <div className="mt-6">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Generating...' : 'Generate Listing Assets'}
            </button>
          </div>
        </form>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="flex">
              <div className="text-red-700">
                <strong>Error:</strong> {error}
              </div>
            </div>
          </div>
        )}

        {assets && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Generated Listing Assets</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Title</h3>
                <p className="bg-gray-50 p-3 rounded border">{assets.title}</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Description</h3>
                <div className="bg-gray-50 p-3 rounded border whitespace-pre-wrap">{assets.description}</div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Key Features</h3>
                <ul className="bg-gray-50 p-3 rounded border list-disc list-inside">
                  {assets.keyFeatures.map((feature, index) => (
                    <li key={index}>{feature}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Tags</h3>
                <div className="bg-gray-50 p-3 rounded border">
                  {assets.tags.join(', ')}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Personalisation (Short)</h3>
                <p className="bg-gray-50 p-3 rounded border">{assets.personalisationShort}</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Personalisation (Long)</h3>
                <div className="bg-gray-50 p-3 rounded border whitespace-pre-wrap">{assets.personalisationLong}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}