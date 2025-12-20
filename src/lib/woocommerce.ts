import { WooCategoryTag } from './types';

// Environment variables for WooCommerce API
const WOO_BASE_URL = process.env.WOO_BASE_URL;
const WOO_CONSUMER_KEY = process.env.WOO_CONSUMER_KEY;
const WOO_CONSUMER_SECRET = process.env.WOO_CONSUMER_SECRET;

// Validate environment variables
function validateWooConfig(): void {
  if (!WOO_BASE_URL || !WOO_CONSUMER_KEY || !WOO_CONSUMER_SECRET) {
    throw new Error(
      'Missing WooCommerce configuration. Ensure WOO_BASE_URL, WOO_CONSUMER_KEY, and WOO_CONSUMER_SECRET are set.'
    );
  }
}

// Create Basic Auth header for WooCommerce REST API
function createAuthHeader(): string {
  validateWooConfig();
  const credentials = Buffer.from(
    `${WOO_CONSUMER_KEY}:${WOO_CONSUMER_SECRET}`
  ).toString('base64');
  return `Basic ${credentials}`;
}

// Generic WooCommerce API call helper
async function wooApiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  validateWooConfig();

  const url = `${WOO_BASE_URL}${endpoint}`;
  const headers = {
    Authorization: createAuthHeader(),
    'Content-Type': 'application/json',
    ...options.headers,
  };

  console.log(`[WooCommerce API] ${options.method || 'GET'} ${endpoint}`);

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    let errorMessage = 'WooCommerce API error';

    try {
      const errorJson = JSON.parse(errorBody);
      errorMessage = errorJson.message || errorMessage;
    } catch {
      errorMessage = errorBody || `HTTP ${response.status}`;
    }

    console.error(
      `[WooCommerce API] Error ${response.status}: ${errorMessage}`
    );

    throw {
      status: response.status,
      message: errorMessage,
    };
  }

  return response.json();
}

// Fetch all categories with pagination handling
export async function fetchAllCategories(): Promise<WooCategoryTag[]> {
  const allCategories: WooCategoryTag[] = [];
  let page = 1;
  const perPage = 100;

  while (true) {
    const categories = await wooApiCall<any[]>(
      `/wp-json/wc/v3/products/categories?per_page=${perPage}&page=${page}`
    );

    if (categories.length === 0) break;

    allCategories.push(
      ...categories.map((cat) => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
      }))
    );

    if (categories.length < perPage) break;
    page++;
  }

  console.log(`[WooCommerce] Fetched ${allCategories.length} categories`);
  return allCategories;
}

// Fetch all tags with pagination handling
export async function fetchAllTags(): Promise<WooCategoryTag[]> {
  const allTags: WooCategoryTag[] = [];
  let page = 1;
  const perPage = 100;

  while (true) {
    const tags = await wooApiCall<any[]>(
      `/wp-json/wc/v3/products/tags?per_page=${perPage}&page=${page}`
    );

    if (tags.length === 0) break;

    allTags.push(
      ...tags.map((tag) => ({
        id: tag.id,
        name: tag.name,
        slug: tag.slug,
      }))
    );

    if (tags.length < perPage) break;
    page++;
  }

  console.log(`[WooCommerce] Fetched ${allTags.length} tags`);
  return allTags;
}

// Create a new category (with "create if missing" logic)
export async function createCategory(name: string): Promise<WooCategoryTag> {
  // Normalize name
  const normalizedName = name.trim();

  if (!normalizedName) {
    throw { status: 400, message: 'Category name cannot be empty' };
  }

  // Check if category already exists (case-insensitive)
  const existingCategories = await fetchAllCategories();
  const existing = existingCategories.find(
    (cat) =>
      cat.name.toLowerCase() === normalizedName.toLowerCase() ||
      cat.slug.toLowerCase() === normalizedName.toLowerCase().replace(/\s+/g, '-')
  );

  if (existing) {
    console.log(
      `[WooCommerce] Category "${normalizedName}" already exists (ID: ${existing.id})`
    );
    return existing;
  }

  // Create new category
  console.log(`[WooCommerce] Creating new category: "${normalizedName}"`);
  const newCategory = await wooApiCall<any>('/wp-json/wc/v3/products/categories', {
    method: 'POST',
    body: JSON.stringify({ name: normalizedName }),
  });

  return {
    id: newCategory.id,
    name: newCategory.name,
    slug: newCategory.slug,
  };
}

// Create a new tag (with "create if missing" logic)
export async function createTag(name: string): Promise<WooCategoryTag> {
  // Normalize name
  const normalizedName = name.trim();

  if (!normalizedName) {
    throw { status: 400, message: 'Tag name cannot be empty' };
  }

  // Check if tag already exists (case-insensitive)
  const existingTags = await fetchAllTags();
  const existing = existingTags.find(
    (tag) =>
      tag.name.toLowerCase() === normalizedName.toLowerCase() ||
      tag.slug.toLowerCase() === normalizedName.toLowerCase().replace(/\s+/g, '-')
  );

  if (existing) {
    console.log(
      `[WooCommerce] Tag "${normalizedName}" already exists (ID: ${existing.id})`
    );
    return existing;
  }

  // Create new tag
  console.log(`[WooCommerce] Creating new tag: "${normalizedName}"`);
  const newTag = await wooApiCall<any>('/wp-json/wc/v3/products/tags', {
    method: 'POST',
    body: JSON.stringify({ name: normalizedName }),
  });

  return {
    id: newTag.id,
    name: newTag.name,
    slug: newTag.slug,
  };
}

// Generate all variation combinations (cartesian product)
export function generateVariationCombinations(
  attributes: { name: string; options: string[] }[]
): { name: string; option: string }[][] {
  if (attributes.length === 0) return [];
  if (attributes.length === 1) {
    return attributes[0].options.map((option) => [
      { name: attributes[0].name, option },
    ]);
  }

  const [first, ...rest] = attributes;
  const restCombinations = generateVariationCombinations(rest);

  const result: { name: string; option: string }[][] = [];
  for (const option of first.options) {
    for (const combo of restCombinations) {
      result.push([{ name: first.name, option }, ...combo]);
    }
  }

  return result;
}

// Create a draft variable product with variations
export async function createDraftVariableProduct(params: {
  name: string;
  description: string;
  short_description: string;
  variationAttributes: { name: string; options: string[] }[];
  categoryIds: number[];
  tagIds: number[];
}): Promise<{ productId: number; permalink: string; adminEditUrl: string }> {
  const {
    name,
    description,
    short_description,
    variationAttributes,
    categoryIds,
    tagIds,
  } = params;

  // Step 1: Create parent variable product
  console.log(`[WooCommerce] Creating draft variable product: "${name}"`);

  const productPayload = {
    name,
    type: 'variable',
    status: 'draft',
    description,
    short_description,
    attributes: variationAttributes.map((attr) => ({
      name: attr.name,
      visible: true,
      variation: true,
      options: attr.options,
    })),
    categories: categoryIds.map((id) => ({ id })),
    tags: tagIds.map((id) => ({ id })),
  };

  const product = await wooApiCall<any>('/wp-json/wc/v3/products', {
    method: 'POST',
    body: JSON.stringify(productPayload),
  });

  const productId = product.id;
  const permalink = product.permalink || '';

  console.log(`[WooCommerce] Created product ID: ${productId}`);

  // Step 2: Create variations (all combinations)
  const combinations = generateVariationCombinations(variationAttributes);
  console.log(
    `[WooCommerce] Creating ${combinations.length} variations for product ${productId}`
  );

  for (const [index, combo] of combinations.entries()) {
    const variationPayload = {
      attributes: combo,
    };

    try {
      await wooApiCall(
        `/wp-json/wc/v3/products/${productId}/variations`,
        {
          method: 'POST',
          body: JSON.stringify(variationPayload),
        }
      );
      console.log(
        `[WooCommerce] Created variation ${index + 1}/${combinations.length}`
      );
    } catch (error) {
      console.error(
        `[WooCommerce] Failed to create variation ${index + 1}:`,
        error
      );
      throw error;
    }
  }

  // Construct admin edit URL
  const adminEditUrl = `${WOO_BASE_URL}/wp-admin/post.php?post=${productId}&action=edit`;

  console.log(`[WooCommerce] Successfully created variable product with ${combinations.length} variations`);

  return {
    productId,
    permalink,
    adminEditUrl,
  };
}

// Fetch all products (for dropdown list in social media manager)
export async function fetchAllProducts(): Promise<any[]> {
  const allProducts: any[] = [];
  let page = 1;
  const perPage = 100;

  while (true) {
    const products = await wooApiCall<any[]>(
      `/wp-json/wc/v3/products?per_page=${perPage}&page=${page}&status=publish`
    );

    if (products.length === 0) break;

    allProducts.push(...products);

    if (products.length < perPage) break;
    page++;
  }

  console.log(`[WooCommerce] Fetched ${allProducts.length} products`);
  return allProducts;
}

// Fetch a single product by ID with full details
export async function fetchProductById(productId: number): Promise<any> {
  console.log(`[WooCommerce] Fetching product ${productId}`);
  const product = await wooApiCall<any>(`/wp-json/wc/v3/products/${productId}`);
  return product;
}

// Fetch all DRAFT products (for photo assignment)
export async function fetchDraftProducts(): Promise<any[]> {
  const allProducts: any[] = [];
  let page = 1;
  const perPage = 100;

  while (true) {
    const products = await wooApiCall<any[]>(
      `/wp-json/wc/v3/products?per_page=${perPage}&page=${page}&status=draft`
    );

    if (products.length === 0) break;

    allProducts.push(...products);

    if (products.length < perPage) break;
    page++;
  }

  console.log(`[WooCommerce] Fetched ${allProducts.length} draft products`);
  return allProducts;
}

// Upload image to WordPress media library
export async function uploadMediaToWooCommerce(
  fileBuffer: Buffer,
  filename: string,
  altText?: string
): Promise<{ id: number; src: string; name: string; alt: string }> {
  validateWooConfig();

  console.log(`[WooCommerce] Uploading media: ${filename}`);

  // WordPress media upload endpoint uses multipart/form-data
  const formData = new FormData();
  // Convert Buffer to Blob properly for FormData
  const blob = new Blob([new Uint8Array(fileBuffer)], { type: 'image/jpeg' });
  formData.append('file', blob, filename);

  if (altText) {
    formData.append('alt_text', altText);
  }

  const url = `${WOO_BASE_URL}/wp-json/wp/v2/media`;
  const headers = {
    Authorization: createAuthHeader(),
    // Note: Don't set Content-Type header - let browser set it with boundary
  };

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`[WooCommerce] Media upload error: ${errorBody}`);
    throw {
      status: response.status,
      message: `Failed to upload media: ${errorBody}`,
    };
  }

  const media = await response.json();

  console.log(`[WooCommerce] Media uploaded successfully: ID ${media.id}`);

  return {
    id: media.id,
    src: media.source_url || media.guid?.rendered || '',
    name: media.title?.rendered || filename,
    alt: media.alt_text || altText || '',
  };
}

// Attach images to a WooCommerce product
export async function attachImagesToProduct(
  productId: number,
  imageIds: number[],
  featuredImageId?: number
): Promise<void> {
  console.log(
    `[WooCommerce] Attaching ${imageIds.length} images to product ${productId}`
  );

  // Prepare payload
  const payload: any = {
    images: imageIds.map((id) => ({ id })),
  };

  // Set featured image if specified
  if (featuredImageId) {
    payload.featured_media = featuredImageId;
  }

  await wooApiCall(`/wp-json/wc/v3/products/${productId}`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  console.log(`[WooCommerce] Images attached successfully`);
}

// Attach images to a WooCommerce product using image URLs
// WooCommerce will download and import the images automatically
export async function attachImagesByUrlToProduct(
  productId: number,
  images: Array<{ src: string; alt?: string }>
): Promise<void> {
  console.log(
    `[WooCommerce] Attaching ${images.length} images by URL to product ${productId}`
  );

  // Prepare payload with image URLs
  // WooCommerce will download the images from these URLs
  const payload: any = {
    images: images.map((img) => ({
      src: img.src,
      alt: img.alt || '',
    })),
  };

  await wooApiCall(`/wp-json/wc/v3/products/${productId}`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  console.log(`[WooCommerce] Images attached successfully by URL`);
}

// Get current images for a product
export async function getProductImages(
  productId: number
): Promise<{ id: number; src: string; name: string; alt: string }[]> {
  console.log(`[WooCommerce] Fetching images for product ${productId}`);

  const product = await fetchProductById(productId);

  const images = product.images || [];

  return images.map((img: any) => ({
    id: img.id,
    src: img.src,
    name: img.name || '',
    alt: img.alt || '',
  }));
}
