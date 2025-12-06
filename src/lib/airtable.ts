import { ListingInput, ListingAssets } from './types';

export async function createAirtableListing(input: ListingInput, assets: ListingAssets): Promise<void> {
  const baseId = process.env.AIRTABLE_BASE_ID;
  const token = process.env.AIRTABLE_TOKEN;
  const tableName = process.env.AIRTABLE_TABLE_NAME || 'Listings';

  if (!baseId) {
    throw new Error('AIRTABLE_BASE_ID environment variable is not set');
  }
  if (!token) {
    throw new Error('AIRTABLE_TOKEN environment variable is not set');
  }

  const pricePostageNotes = [input.priceNotes, input.postageNotes]
    .filter(Boolean)
    .join('\n\n');

  const fields = {
    'Product Name': input.productName,
    'Raw Input – What is it?': input.whatIsIt,
    'Raw Input – Who is it for?': input.whoIsItFor,
    'Raw Input – Variations': input.variations,
    'Raw Input – Personalisation': input.personalisation,
    'Raw Input – Price/Postage notes': pricePostageNotes || '',
    'Listing Title': assets.title,
    'Listing Description': assets.description,
    'Key Features (bullets)': assets.keyFeatures.join('\n'),
    'Listing Tags': assets.tags.join(', '),
    'Personalisation – Short': assets.personalisationShort,
    'Personalisation – Long': assets.personalisationLong,
    'Status': 'Draft'
  };

  const response = await fetch(`https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fields: fields
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Airtable API error: ${response.status} ${response.statusText} - ${errorText}`);
  }
}