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

  // Custom post state
  const [customImage, setCustomImage] = useState<File | null>(null);
  const [customImagePreview, setCustomImagePreview] = useState<string | null>(null);
  const [customIdea, setCustomIdea] = useState<string>('');
  const [customPost, setCustomPost] = useState<string>('');
  const [generatingCustomPost, setGeneratingCustomPost] = useState(false);
  const [postingCustomPost, setPostingCustomPost] = useState(false);
  const [postingToInstagram, setPostingToInstagram] = useState(false);
  const [customError, setCustomError] = useState<string | null>(null);
  const [customSuccess, setCustomSuccess] = useState<string | null>(null);

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
          productUrl: selectedProduct.permalink, // Link to the WooCommerce product page
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

  // Custom post handlers
  const handleCustomImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCustomImage(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setCustomImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateCustomPost = async () => {
    if (!customIdea.trim()) {
      setCustomError('Please enter an idea for your post');
      return;
    }

    setGeneratingCustomPost(true);
    setCustomError(null);
    setCustomSuccess(null);

    try {
      const response = await fetch('/api/generate-post-from-idea', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea: customIdea }),
      });

      const data = await response.json();

      if (data.ok) {
        setCustomPost(data.post);
        setCustomSuccess('Post generated! Edit it below if needed.');
      } else {
        setCustomError(`Failed to generate post: ${data.error}`);
      }
    } catch (err) {
      setCustomError('Network error while generating post');
    } finally {
      setGeneratingCustomPost(false);
    }
  };

  const handlePostCustomToFacebook = async () => {
    if (!customPost.trim()) {
      setCustomError('Please generate a post first');
      return;
    }

    if (!customImage) {
      setCustomError('Please select an image');
      return;
    }

    setPostingCustomPost(true);
    setCustomError(null);
    setCustomSuccess(null);

    try {
      // Upload image to Vercel Blob first
      const formData = new FormData();
      formData.append('file', customImage);

      const uploadResponse = await fetch('/api/photos/upload', {
        method: 'POST',
        body: formData,
      });

      const uploadData = await uploadResponse.json();

      if (!uploadData.ok) {
        throw new Error(uploadData.error || 'Failed to upload image');
      }

      // Post to Facebook with uploaded image URL and website link in the message
      // Add website URL to the post text so it's clickable
      const messageWithLink = `${customPost}\n\n🔗 Visit us: https://www.lakewayworkshop.co.uk`;

      const fbResponse = await fetch('/api/facebook/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageWithLink,
          imageUrl: uploadData.imageUrl,
        }),
      });

      const fbData = await fbResponse.json();

      if (fbData.ok) {
        setCustomSuccess(`Successfully posted to Facebook! View: ${fbData.facebookPostUrl}`);
        // Clear form after successful post
        setTimeout(() => {
          setCustomImage(null);
          setCustomImagePreview(null);
          setCustomIdea('');
          setCustomPost('');
          setCustomSuccess(null);
        }, 5000);
      } else {
        setCustomError(`Failed to post to Facebook: ${fbData.error}`);
      }
    } catch (err: any) {
      setCustomError(err.message || 'Error posting to Facebook');
    } finally {
      setPostingCustomPost(false);
    }
  };

  const handlePostCustomToInstagram = async () => {
    if (!customPost.trim()) {
      setCustomError('Please generate a post first');
      return;
    }

    if (!customImage) {
      setCustomError('Please select an image');
      return;
    }

    setPostingToInstagram(true);
    setCustomError(null);
    setCustomSuccess(null);

    try {
      // Upload image to Vercel Blob first
      const formData = new FormData();
      formData.append('file', customImage);

      const uploadResponse = await fetch('/api/photos/upload', {
        method: 'POST',
        body: formData,
      });

      const uploadData = await uploadResponse.json();

      if (!uploadData.ok) {
        throw new Error(uploadData.error || 'Failed to upload image');
      }

      // Post to Instagram with uploaded image URL
      const igResponse = await fetch('/api/instagram/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caption: customPost,
          imageUrl: uploadData.imageUrl,
        }),
      });

      const igData = await igResponse.json();

      if (igData.ok) {
        setCustomSuccess(`Successfully posted to Instagram! View on your Instagram profile.`);
        // Clear form after successful post
        setTimeout(() => {
          setCustomImage(null);
          setCustomImagePreview(null);
          setCustomIdea('');
          setCustomPost('');
          setCustomSuccess(null);
        }, 5000);
      } else {
        setCustomError(`Failed to post to Instagram: ${igData.error}`);
      }
    } catch (err: any) {
      setCustomError(err.message || 'Error posting to Instagram');
    } finally {
      setPostingToInstagram(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-12">
      <div className="mx-auto max-w-6xl px-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 sm:mb-8">
          Social Media Manager
        </h1>

        {/* Custom Post Section */}
        <div className="bg-white shadow rounded-lg p-4 sm:p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Create Custom Post</h2>
          <p className="text-sm text-gray-600 mb-4">
            Upload a photo and write a short idea - AI will help you create the perfect post!
          </p>

          {/* Custom Error/Success Messages */}
          {customError && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
              <p className="text-red-700 text-sm">{customError}</p>
            </div>
          )}

          {customSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-md p-3 mb-4">
              <p className="text-green-700 text-sm">{customSuccess}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Photo
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                {customImagePreview ? (
                  <div className="relative">
                    <img
                      src={customImagePreview}
                      alt="Preview"
                      className="w-full h-64 object-cover rounded"
                    />
                    <button
                      onClick={() => {
                        setCustomImage(null);
                        setCustomImagePreview(null);
                      }}
                      className="absolute top-2 right-2 bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div>
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={handleCustomImageChange}
                      className="hidden"
                      id="custom-image-upload"
                    />
                    <label
                      htmlFor="custom-image-upload"
                      className="cursor-pointer inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                      Choose from Gallery
                    </label>
                    <p className="text-xs text-gray-500 mt-2">JPEG, PNG, or WebP</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Post Idea & Generation */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Post Idea
                </label>
                <textarea
                  value={customIdea}
                  onChange={(e) => setCustomIdea(e.target.value)}
                  rows={4}
                  placeholder="e.g., 'Excited to share our new handmade wooden signs! Perfect for Christmas gifts.'"
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 text-sm"
                  disabled={generatingCustomPost || postingCustomPost}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Write a short idea - AI will expand it into a full post
                </p>
              </div>

              <button
                onClick={handleGenerateCustomPost}
                disabled={!customIdea.trim() || generatingCustomPost || postingCustomPost}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {generatingCustomPost ? 'Generating...' : 'Generate Post with AI'}
              </button>

              {/* Generated Post Text */}
              {customPost && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Generated Post (Edit if needed)
                  </label>
                  <textarea
                    value={customPost}
                    onChange={(e) => setCustomPost(e.target.value)}
                    rows={8}
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 text-sm"
                    disabled={postingCustomPost}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {customPost.length} characters
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                    <button
                      onClick={handlePostCustomToFacebook}
                      disabled={!customImage || postingCustomPost || postingToInstagram}
                      className="w-full bg-blue-600 text-white py-3 px-4 rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold"
                    >
                      {postingCustomPost ? 'Posting...' : 'Post To Facebook Now'}
                    </button>

                    <button
                      onClick={handlePostCustomToInstagram}
                      disabled={!customImage || postingCustomPost || postingToInstagram}
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-4 rounded hover:from-purple-700 hover:to-pink-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold"
                    >
                      {postingToInstagram ? 'Posting...' : 'Post To Instagram Now'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="border-t-4 border-gray-200 my-8"></div>

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
                  {postingToFacebook ? 'Posting to Facebook...' : 'Post To Facebook Now'}
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
              <li>Click "Post To Facebook Now" to publish immediately to your Facebook Business Page</li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}
