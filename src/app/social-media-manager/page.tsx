'use client';

import { useState, useEffect } from 'react';
import {
  WooProductListItem,
  WooProduct,
  SocialMediaPost,
  ScheduledSocialPost,
} from '@/lib/types';

export default function SocialMediaManager() {
  const [products, setProducts] = useState<WooProductListItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<WooProduct | null>(null);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingProduct, setLoadingProduct] = useState(false);
  const [generatingPost, setGeneratingPost] = useState(false);
  const [post, setPost] = useState<SocialMediaPost | null>(null);
  const [postingToFacebook, setPostingToFacebook] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch all products on mount
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoadingProducts(true);
    setError(null);
    try {
      const response = await fetch('/api/woocommerce/products');
      const data = await response.json();
      if (data.ok) {
        setProducts(data.products);
      } else {
        setError(`Failed to load products: ${data.error}`);
      }
    } catch (err) {
      setError('Failed to load products');
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleProductSelect = async (productId: number) => {
    if (productId === selectedProductId) return;

    setSelectedProductId(productId);
    setSelectedProduct(null);
    setPost(null);
    setError(null);
    setSuccess(null);
    setLoadingProduct(true);

    try {
      const response = await fetch(`/api/woocommerce/products/${productId}`);
      const data = await response.json();
      if (data.ok) {
        setSelectedProduct(data.product);
      } else {
        setError(`Failed to load product: ${data.error}`);
      }
    } catch (err) {
      setError('Failed to load product details');
    } finally {
      setLoadingProduct(false);
    }
  };

  const handleGeneratePost = async () => {
    if (!selectedProduct) return;

    setGeneratingPost(true);
    setError(null);
    setSuccess(null);
    setPost(null);

    try {
      const payload = {
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        description: selectedProduct.description,
        shortDescription: selectedProduct.short_description,
        price: selectedProduct.price,
        categories: selectedProduct.categories.map((c) => c.name),
        tags: selectedProduct.tags.map((t) => t.name),
        imageUrls: selectedProduct.images.map((img) => img.src),
      };

      const response = await fetch('/api/generate-social-posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.ok && data.posts && data.posts.length > 0) {
        const generatedPost: SocialMediaPost = {
          ...data.posts[0],
          id: `post-${Date.now()}`,
          scheduledDateTime: undefined,
        };
        setPost(generatedPost);
        setSuccess('Generated Facebook post!');
      } else {
        setError(`Failed to generate post: ${data.error}`);
      }
    } catch (err) {
      setError('Network error while generating post');
    } finally {
      setGeneratingPost(false);
    }
  };

  const handlePostTextChange = (newText: string) => {
    if (!post) return;
    setPost({
      ...post,
      text: newText,
      characterCount: newText.length,
    });
  };

  const handlePostNow = async () => {
    if (!post || !selectedProduct) return;

    setPostingToFacebook(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/facebook/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: post.text,
          imageUrl: post.imageUrl,
        }),
      });

      const data = await response.json();

      if (data.ok) {
        setSuccess(`Successfully posted to Facebook! View: ${data.facebookPostUrl}`);
        // Clear the post after successful posting
        setTimeout(() => {
          setPost(null);
          setSuccess(null);
        }, 5000);
      } else {
        setError(`Failed to post to Facebook: ${data.error}`);
      }
    } catch (err) {
      setError('Network error while posting to Facebook');
    } finally {
      setPostingToFacebook(false);
    }
  };

  const stripHtml = (html: string): string => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-12">
      <div className="mx-auto max-w-6xl px-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 sm:mb-8">
          Social Media Manager
        </h1>

        {/* Product Selection */}
        <div className="bg-white shadow rounded-lg p-4 sm:p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Select Product</h2>

          {loadingProducts ? (
            <p className="text-gray-600">Loading products...</p>
          ) : (
            <div>
              <label htmlFor="product-select" className="block text-sm font-medium text-gray-700 mb-2">
                Choose a product from WooCommerce:
              </label>
              <select
                id="product-select"
                value={selectedProductId || ''}
                onChange={(e) => handleProductSelect(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Select a product --</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} (£{product.price})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Product Preview */}
        {loadingProduct && (
          <div className="bg-white shadow rounded-lg p-4 sm:p-6 mb-6">
            <p className="text-gray-600">Loading product details...</p>
          </div>
        )}

        {selectedProduct && !loadingProduct && (
          <div className="bg-white shadow rounded-lg p-4 sm:p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Product Preview</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Product Images */}
              <div>
                {selectedProduct.images.length > 0 ? (
                  <div className="space-y-2">
                    <img
                      src={selectedProduct.images[0].src}
                      alt={selectedProduct.images[0].alt}
                      className="w-full rounded border"
                    />
                    {selectedProduct.images.length > 1 && (
                      <div className="grid grid-cols-3 gap-2">
                        {selectedProduct.images.slice(1, 4).map((img) => (
                          <img
                            key={img.id}
                            src={img.src}
                            alt={img.alt}
                            className="w-full h-20 object-cover rounded border"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-full h-64 bg-gray-200 rounded flex items-center justify-center">
                    <p className="text-gray-500">No images</p>
                  </div>
                )}
              </div>

              {/* Product Details */}
              <div className="space-y-3">
                <div>
                  <h3 className="text-lg font-semibold">{selectedProduct.name}</h3>
                  <p className="text-2xl font-bold text-blue-600">£{selectedProduct.price}</p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-700">Description:</h4>
                  <p className="text-sm text-gray-600 line-clamp-4">
                    {stripHtml(selectedProduct.description)}
                  </p>
                </div>

                {selectedProduct.categories.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-700">Categories:</h4>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {selectedProduct.categories.map((cat) => (
                        <span key={cat.id} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                          {cat.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedProduct.tags.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-700">Tags:</h4>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {selectedProduct.tags.map((tag) => (
                        <span key={tag.id} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={handleGeneratePost}
                  disabled={generatingPost || !selectedProduct.images.length}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed mt-4"
                >
                  {generatingPost ? 'Generating Post...' : 'Generate Facebook Post'}
                </button>

                {!selectedProduct.images.length && (
                  <p className="text-sm text-red-600 mt-2">This product needs at least one image to generate a post.</p>
                )}
              </div>
            </div>
          </div>
        )}

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

        {/* Generated Post */}
        {post && (
          <div className="bg-white shadow rounded-lg p-4 sm:p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Generated Facebook Post</h2>
              <span className="text-sm text-gray-600">{post.characterCount} characters</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Image Preview */}
              <div>
                <img
                  src={post.imageUrl}
                  alt={post.imageAlt}
                  className="w-full h-64 object-cover rounded border"
                />
              </div>

              {/* Post Text & Actions */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Post Text:</label>
                  <textarea
                    value={post.text}
                    onChange={(e) => handlePostTextChange(e.target.value)}
                    rows={8}
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">Edit the post text above before posting</p>
                </div>

                <button
                  onClick={handlePostNow}
                  disabled={postingToFacebook}
                  className="w-full bg-green-600 text-white py-3 px-4 rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold"
                >
                  {postingToFacebook ? 'Posting to Facebook...' : 'Post Now to Facebook'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Info Box */}
        {!selectedProduct && !post && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <h3 className="font-semibold text-blue-900 mb-2">How to use:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
              <li>Select a product from the dropdown</li>
              <li>Review the product details and click "Generate Facebook Post"</li>
              <li>Edit the generated post text if needed</li>
              <li>Click "Post Now to Facebook" to publish immediately to your Facebook Business Page</li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}
