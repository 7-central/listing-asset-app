'use client';

import { useState, useEffect } from 'react';
import type { DraftProduct } from '@/lib/types';

type ProductSearcherProps = {
  onProductSelect: (product: DraftProduct) => void;
  selectedProductId: number | null;
};

export default function ProductSearcher({
  onProductSelect,
  selectedProductId,
}: ProductSearcherProps) {
  const [products, setProducts] = useState<DraftProduct[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<DraftProduct[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch draft products on mount
  useEffect(() => {
    fetchDraftProducts();
  }, []);

  // Filter products when search term changes
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredProducts(products);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = products.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.id.toString().includes(term)
      );
      setFilteredProducts(filtered);
    }
  }, [searchTerm, products]);

  const fetchDraftProducts = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/woocommerce/products?status=draft');
      const data = await response.json();

      if (data.ok) {
        const draftProducts: DraftProduct[] = data.products.map((p: any) => ({
          id: p.id,
          name: p.name,
          status: p.status,
          permalink: p.permalink,
        }));
        setProducts(draftProducts);
        setFilteredProducts(draftProducts);
      } else {
        setError(data.error || 'Failed to load draft products');
      }
    } catch (err) {
      setError('Network error loading products');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-4 sm:p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Select Draft Product</h2>

      {loading ? (
        <p className="text-gray-600">Loading draft products...</p>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
          <p className="text-red-700">{error}</p>
          <button
            onClick={fetchDraftProducts}
            className="mt-2 text-sm text-red-600 hover:text-red-700 underline"
          >
            Try again
          </button>
        </div>
      ) : (
        <>
          {/* Search Input */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search by product name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Product List */}
          {filteredProducts.length === 0 ? (
            <p className="text-gray-600 text-center py-4">
              {searchTerm ? 'No products match your search' : 'No draft products found'}
            </p>
          ) : (
            <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
              {filteredProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => onProductSelect(product)}
                  className={`w-full text-left px-4 py-3 border-b border-gray-200 hover:bg-blue-50 transition ${
                    selectedProductId === product.id
                      ? 'bg-blue-100 border-l-4 border-l-blue-600'
                      : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{product.name}</p>
                      <p className="text-sm text-gray-500">ID: {product.id}</p>
                    </div>
                    {selectedProductId === product.id && (
                      <svg
                        className="w-6 h-6 text-blue-600 flex-shrink-0 ml-2"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          <p className="text-sm text-gray-500 mt-3">
            Found {filteredProducts.length} draft product{filteredProducts.length !== 1 ? 's' : ''}
          </p>
        </>
      )}
    </div>
  );
}
