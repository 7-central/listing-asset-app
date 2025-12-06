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