import { ListingInput, ListingAssets, RoyalMailAdviceRequest, RoyalMailAdviceResponse, GenerateSocialPostsRequest, GenerateSocialPostsResponse } from './types';

export async function generateListingAssets(input: ListingInput): Promise<ListingAssets> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable is not set');
  }

  const prompt = buildPrompt(input);

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Anthropic API error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();

  if (!data.content?.[0]?.text) {
    throw new Error('No content returned from Anthropic API');
  }

  let content = data.content[0].text.trim();

  // Strip markdown code blocks if present
  if (content.startsWith('```')) {
    // Remove opening ```json or ``` and closing ```
    content = content.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
  }

  let parsedAssets: unknown;
  try {
    parsedAssets = JSON.parse(content);
  } catch (error) {
    throw new Error(`Failed to parse Anthropic response as JSON: ${error}`);
  }

  // Basic runtime validation
  if (!parsedAssets || typeof parsedAssets !== 'object') {
    throw new Error('Invalid response: expected object');
  }

  const assets = parsedAssets as Record<string, unknown>;

  if (!assets.title || typeof assets.title !== 'string') {
    throw new Error('Invalid response: title must be a string');
  }
  if (!assets.description || typeof assets.description !== 'string') {
    throw new Error('Invalid response: description must be a string');
  }
  if (!Array.isArray(assets.keyFeatures)) {
    throw new Error('Invalid response: keyFeatures must be an array');
  }
  if (!Array.isArray(assets.tags)) {
    throw new Error('Invalid response: tags must be an array');
  }
  if (!assets.personalisationShort || typeof assets.personalisationShort !== 'string') {
    throw new Error('Invalid response: personalisationShort must be a string');
  }
  if (!assets.personalisationLong || typeof assets.personalisationLong !== 'string') {
    throw new Error('Invalid response: personalisationLong must be a string');
  }

  return assets as ListingAssets;
}

function buildPrompt(input: ListingInput): string {
  const variations = input.variations ? `\n\nAvailable variations: ${input.variations}` : '';
  const personalisation = input.personalisation ? `\n\nPersonalisation options: ${input.personalisation}` : '';
  const priceNotes = input.priceNotes ? `\n\nPricing notes: ${input.priceNotes}` : '';
  const postageNotes = input.postageNotes ? `\n\nPostage notes: ${input.postageNotes}` : '';

  return `You are a professional e-commerce listing copywriter. Generate professional Etsy listing content for this product:

Product: ${input.productName}

Description: ${input.whatIsIt}

Target audience: ${input.whoIsItFor}${variations}${personalisation}${priceNotes}${postageNotes}

You must respond with ONLY valid JSON in this exact format:
{
  "title": "SEO-optimized Etsy title (max 140 characters)",
  "description": "Engaging product description with benefits and features",
  "keyFeatures": ["Feature 1", "Feature 2", "Feature 3"],
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "personalisationShort": "Brief personalisation description (1-2 sentences)",
  "personalisationLong": "Detailed personalisation instructions and options"
}

Focus on:
- SEO-friendly titles with relevant keywords
- Benefit-driven descriptions that connect with the target audience
- Clear, compelling key features
- Relevant Etsy search tags
- Professional personalisation guidance

Respond with ONLY the JSON object, no other text or explanations.`;
}

export async function getRoyalMailAdvice(input: RoyalMailAdviceRequest): Promise<RoyalMailAdviceResponse> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable is not set');
  }

  const prompt = buildRoyalMailPrompt(input);

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Anthropic API error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();

  if (!data.content?.[0]?.text) {
    throw new Error('No content returned from Anthropic API');
  }

  let content = data.content[0].text.trim();

  // Strip markdown code blocks if present
  if (content.startsWith('```')) {
    content = content.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
  }

  let parsedAdvice: unknown;
  try {
    parsedAdvice = JSON.parse(content);
  } catch (error) {
    throw new Error(`Failed to parse Anthropic response as JSON: ${error}`);
  }

  // Basic runtime validation
  if (!parsedAdvice || typeof parsedAdvice !== 'object') {
    throw new Error('Invalid response: expected object');
  }

  const advice = parsedAdvice as Record<string, unknown>;

  if (!advice.serviceName || typeof advice.serviceName !== 'string') {
    throw new Error('Invalid response: serviceName must be a string');
  }
  if (!advice.bracket || typeof advice.bracket !== 'string') {
    throw new Error('Invalid response: bracket must be a string');
  }
  if (typeof advice.estimatedCostNet !== 'number') {
    throw new Error('Invalid response: estimatedCostNet must be a number');
  }
  if (!advice.maxDimensionsMm || typeof advice.maxDimensionsMm !== 'object') {
    throw new Error('Invalid response: maxDimensionsMm must be an object');
  }

  const maxDims = advice.maxDimensionsMm as Record<string, unknown>;
  if (typeof maxDims.width !== 'number' || typeof maxDims.height !== 'number' || typeof maxDims.depth !== 'number') {
    throw new Error('Invalid response: maxDimensionsMm must contain width, height, and depth as numbers');
  }

  return advice as RoyalMailAdviceResponse;
}

function buildRoyalMailPrompt(input: RoyalMailAdviceRequest): string {
  return `You are a UK shipping expert. Based on the package specifications provided, recommend the most suitable Royal Mail service and pricing.

Package specifications:
- Weight: ${input.weightGrams}g
- Dimensions: ${input.widthMm}mm (W) x ${input.heightMm}mm (H) x ${input.depthMm}mm (D)

You must respond with ONLY valid JSON in this exact format:
{
  "serviceName": "Royal Mail service name (e.g., Royal Mail 2nd Class Small Parcel)",
  "bracket": "Size/weight bracket name (e.g., Small Parcel 0-2kg)",
  "estimatedCostNet": 3.50,
  "maxDimensionsMm": {
    "width": 610,
    "height": 460,
    "depth": 460
  }
}

Choose the most cost-effective Royal Mail service that accommodates these dimensions and weight. Common options include:
- Large Letter (max 353mm x 250mm x 25mm, up to 750g)
- Small Parcel (max 610mm x 460mm x 460mm, up to 2kg)
- Medium Parcel (max 610mm x 460mm x 460mm, 2-20kg)

Provide realistic 2025 UK pricing (net, excluding VAT) based on typical Royal Mail rates. Be conservative and round up slightly.

Respond with ONLY the JSON object, no other text or explanations.`;
}

export async function generateSocialMediaPosts(input: GenerateSocialPostsRequest): Promise<GenerateSocialPostsResponse> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable is not set');
  }

  const prompt = buildSocialMediaPrompt(input);

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2500,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Anthropic API error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();

  if (!data.content?.[0]?.text) {
    throw new Error('No content returned from Anthropic API');
  }

  let content = data.content[0].text.trim();

  // Strip markdown code blocks if present
  if (content.startsWith('```')) {
    content = content.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
  }

  let parsedPosts: unknown;
  try {
    parsedPosts = JSON.parse(content);
  } catch (error) {
    throw new Error(`Failed to parse Anthropic response as JSON: ${error}`);
  }

  // Basic runtime validation
  if (!parsedPosts || typeof parsedPosts !== 'object') {
    throw new Error('Invalid response: expected object');
  }

  const postsObj = parsedPosts as Record<string, unknown>;

  if (!Array.isArray(postsObj.posts)) {
    throw new Error('Invalid response: posts must be an array');
  }

  // Validate each post
  postsObj.posts.forEach((post: any, index: number) => {
    if (!post.text || typeof post.text !== 'string') {
      throw new Error(`Invalid response: post ${index} must have text field`);
    }
    if (typeof post.imageIndex !== 'number') {
      throw new Error(`Invalid response: post ${index} must have imageIndex field`);
    }
    if (!post.platform || typeof post.platform !== 'string') {
      throw new Error(`Invalid response: post ${index} must have platform field`);
    }
  });

  // Map imageIndex to actual image URLs
  const posts = postsObj.posts.map((post: any) => {
    const imageIndex = Math.min(post.imageIndex, input.imageUrls.length - 1);
    const imageUrl = input.imageUrls[imageIndex] || input.imageUrls[0] || '';

    return {
      text: post.text,
      imageUrl,
      imageAlt: input.productName,
      platform: post.platform,
      characterCount: post.text.length,
    };
  });

  return { posts };
}

function buildSocialMediaPrompt(input: GenerateSocialPostsRequest): string {
  const categoryList = input.categories.length > 0 ? input.categories.join(', ') : 'N/A';
  const tagList = input.tags.length > 0 ? input.tags.join(', ') : 'N/A';

  return `You are a social media marketing expert for a handmade crafts business. Generate 1 engaging Facebook post for the following product:

Product Name: ${input.productName}
Price: £${input.price}
Description: ${input.description}
Short Description: ${input.shortDescription}
Categories: ${categoryList}
Tags: ${tagList}
Available Images: ${input.imageUrls.length} product images

Generate 1 engaging post optimized for Facebook. The post should:
- Be engaging and encourage interaction
- Use appropriate emojis naturally (not excessively)
- Include a call-to-action
- Highlight product features or benefits
- Stay within 400 characters (recommended for Facebook)
- NOT include hashtags (we'll add those separately)
- NOT include URLs or links
- Be authentic and brand-appropriate for a handmade crafts business

You must respond with ONLY valid JSON in this exact format:
{
  "posts": [
    {
      "text": "Engaging post text here with emojis and call-to-action...",
      "imageIndex": 0,
      "platform": "facebook"
    }
  ]
}

Important:
- imageIndex refers to which product image to use (0 to ${input.imageUrls.length - 1})
- platform should be "facebook"
- Keep the post concise, authentic, and engaging

Respond with ONLY the JSON object, no other text or explanations.`;
}
