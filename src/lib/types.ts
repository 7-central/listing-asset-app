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