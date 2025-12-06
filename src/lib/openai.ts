import { ListingInput, ListingAssets } from './types';

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
