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