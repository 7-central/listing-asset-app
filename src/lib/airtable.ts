import { ListingInput, ListingAssets, ScheduledSocialPost } from './types';

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

// Save scheduled social media posts to Airtable
export async function createScheduledSocialPosts(posts: Omit<ScheduledSocialPost, 'id'>[]): Promise<void> {
  const baseId = process.env.AIRTABLE_BASE_ID;
  const token = process.env.AIRTABLE_TOKEN;
  const tableName = 'Scheduled Social Posts'; // New table for social posts

  if (!baseId) {
    throw new Error('AIRTABLE_BASE_ID environment variable is not set');
  }
  if (!token) {
    throw new Error('AIRTABLE_TOKEN environment variable is not set');
  }

  // Create records in batch
  const records = posts.map((post) => ({
    fields: {
      'Post Text': post.postText,
      'Image URL': post.imageUrl,
      'Product ID': post.productId,
      'Product Name': post.productName,
      'Scheduled Date/Time': post.scheduledDateTime,
      'Post Status': post.status,
      'Platform': post.platform,
    },
  }));

  console.log('[Airtable] Creating records in table:', tableName);
  console.log('[Airtable] Field names being sent:', Object.keys(records[0].fields));

  const response = await fetch(
    `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ records }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[Airtable] Error response:', errorText);
    console.error('[Airtable] Table name:', tableName);
    console.error('[Airtable] Fields sent:', Object.keys(records[0].fields));
    throw new Error(`Airtable API error: ${response.status} ${response.statusText} - ${errorText}`);
  }
}

// Fetch all scheduled social posts
export async function fetchScheduledSocialPosts(): Promise<ScheduledSocialPost[]> {
  const baseId = process.env.AIRTABLE_BASE_ID;
  const token = process.env.AIRTABLE_TOKEN;
  const tableName = 'Scheduled Social Posts';

  if (!baseId) {
    throw new Error('AIRTABLE_BASE_ID environment variable is not set');
  }
  if (!token) {
    throw new Error('AIRTABLE_TOKEN environment variable is not set');
  }

  const response = await fetch(
    `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}?sort[0][field]=Scheduled+Date%2FTime&sort[0][direction]=asc`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Airtable API error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();

  return data.records.map((record: any) => ({
    id: record.id,
    postText: record.fields['Post Text'] || '',
    imageUrl: record.fields['Image URL'] || '',
    productId: record.fields['Product ID'] || 0,
    productName: record.fields['Product Name'] || '',
    scheduledDateTime: record.fields['Scheduled Date/Time'] || '',
    status: record.fields['Post Status'] || 'scheduled',
    platform: record.fields['Platform'] || 'both',
    postedDateTime: record.fields['Posted Date/Time'],
    errorMessage: record.fields['Error Message'],
    facebookPostId: record.fields['Facebook Post ID'],
    facebookPostUrl: record.fields['Facebook Post URL'],
  }));
}

// Update a scheduled social post after posting to Facebook
export async function updateScheduledSocialPost(
  recordId: string,
  updates: {
    status?: 'scheduled' | 'posted' | 'failed';
    postedDateTime?: string;
    facebookPostId?: string;
    facebookPostUrl?: string;
    errorMessage?: string;
  }
): Promise<void> {
  const baseId = process.env.AIRTABLE_BASE_ID;
  const token = process.env.AIRTABLE_TOKEN;
  const tableName = 'Scheduled Social Posts';

  if (!baseId) {
    throw new Error('AIRTABLE_BASE_ID environment variable is not set');
  }
  if (!token) {
    throw new Error('AIRTABLE_TOKEN environment variable is not set');
  }

  const fields: Record<string, any> = {};
  if (updates.status) fields['Post Status'] = updates.status;
  if (updates.postedDateTime) fields['Posted Date/Time'] = updates.postedDateTime;
  if (updates.facebookPostId) fields['Facebook Post ID'] = updates.facebookPostId;
  if (updates.facebookPostUrl) fields['Facebook Post URL'] = updates.facebookPostUrl;
  if (updates.errorMessage) fields['Error Message'] = updates.errorMessage;

  const response = await fetch(
    `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}/${recordId}`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fields }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Airtable API error: ${response.status} ${response.statusText} - ${errorText}`);
  }
}