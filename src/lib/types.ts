export type ListingInput = {
  productName: string;
  whatIsIt: string;
  whoIsItFor: string;
  variations: string;
  personalisation: string;
  priceNotes?: string;
  postageNotes?: string;
};

export type ListingAssets = {
  title: string;
  description: string;
  keyFeatures: string[];
  tags: string[];
  personalisationShort: string;
  personalisationLong: string;
};

// Pricing Calculator Types

export type BillOfMaterialsItem = {
  id: string;
  description: string;
  costPerUnit: number; // Net £
};

export type RoyalMailAdviceRequest = {
  weightGrams: number;
  widthMm: number;
  heightMm: number;
  depthMm: number;
};

export type RoyalMailAdviceResponse = {
  serviceName: string;
  bracket: string;
  estimatedCostNet: number; // Net £
  maxDimensionsMm: {
    width: number;
    height: number;
    depth: number;
  };
};

export type MarketplaceOption =
  | 'all-worst-case'
  | 'etsy'
  | 'woocommerce'
  | 'amazon-handmade';

export type MarketplaceFeeConfig = {
  name: string;
  percentageFee: number; // Percentage (e.g., 9.5 for 9.5%)
  fixedFee: number; // Fixed fee in £
  notes: string;
};

// WooCommerce Integration Types

export type WooVariationAttribute = {
  name: string; // e.g., "Colour", "Size"
  options: string[]; // e.g., ["Red", "Blue", "Green"]
};

export type WooCategoryTag = {
  id: number;
  name: string;
  slug: string;
};

export type WooCreateDraftRequest = {
  name: string; // Product title
  description: string; // Long description (HTML)
  short_description: string; // Short description
  variationAttributes: WooVariationAttribute[];
  categoryIds: number[];
  tagIds: number[];
};

export type WooCreateDraftResponse = {
  productId: number;
  permalink: string;
  adminEditUrl: string;
};

export type WooErrorResponse = {
  ok: false;
  error: string;
  details?: {
    status: number;
    message: string;
  };
};

// Social Media Manager Types

export type WooProduct = {
  id: number;
  name: string;
  description: string;
  short_description: string;
  price: string;
  regular_price: string;
  images: {
    id: number;
    src: string;
    alt: string;
  }[];
  categories: {
    id: number;
    name: string;
  }[];
  tags: {
    id: number;
    name: string;
  }[];
  permalink: string;
};

export type WooProductListItem = {
  id: number;
  name: string;
  price: string;
  thumbnail: string;
};

export type SocialMediaPost = {
  id: string;
  text: string;
  imageUrl: string;
  imageAlt: string;
  productUrl?: string; // Link to the product page on WooCommerce
  platform: 'facebook' | 'instagram' | 'both';
  scheduledDateTime?: string; // ISO 8601 format
  characterCount: number;
};

export type GenerateSocialPostsRequest = {
  productId: number;
  productName: string;
  description: string;
  shortDescription: string;
  price: string;
  categories: string[];
  tags: string[];
  imageUrls: string[];
};

export type GenerateSocialPostsResponse = {
  posts: Omit<SocialMediaPost, 'id' | 'scheduledDateTime'>[];
};

export type ScheduledSocialPost = {
  id?: string; // Airtable record ID
  postText: string;
  imageUrl: string;
  productId: number;
  productName: string;
  productUrl?: string; // Link to the product page on WooCommerce
  scheduledDateTime: string; // ISO 8601
  status: 'scheduled' | 'posted' | 'failed';
  platform: 'facebook' | 'instagram' | 'both';
  postedDateTime?: string;
  errorMessage?: string;
  facebookPostId?: string; // Facebook post ID after posting
  facebookPostUrl?: string; // Facebook post URL
};

// Photos Feature Types

export type PhotoUploadSession = {
  productId: number;
  productName: string;
  photos: PhotoItem[];
};

export type PhotoItem = {
  id: string; // Client-side ID (uuidv4)
  file: File;
  thumbnail: string; // Base64 or blob URL for preview
  caption?: string;
  orderIndex: number;
  uploadStatus: 'pending' | 'uploading' | 'success' | 'error';
  uploadProgress?: number;
  blobUrl?: string; // Vercel Blob URL (backup)
  wooMediaId?: number; // WooCommerce media library ID
  wooImageUrl?: string; // WooCommerce image URL
  error?: string;
  isFeatured?: boolean;
};

export type UploadPhotoRequest = {
  file: File;
  caption?: string;
};

export type UploadPhotoResponse = {
  ok: boolean;
  blobUrl: string;
  wooMediaId: number;
  wooImageUrl: string;
  filename: string;
};

export type AttachPhotosRequest = {
  productId: number;
  imageIds: number[];
  featuredImageId?: number;
};

export type AttachPhotosResponse = {
  ok: boolean;
  message: string;
  productId: number;
  imageCount: number;
};

export type WooProductImage = {
  id: number;
  src: string;
  name: string;
  alt: string;
};

export type DraftProduct = {
  id: number;
  name: string;
  status: string;
  permalink: string;
};