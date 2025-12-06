import { NextResponse } from 'next/server';
import { ListingInput } from '@/lib/types';
import { generateListingAssets } from '@/lib/openai';
import { createAirtableListing } from '@/lib/airtable';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Basic validation
    const input: ListingInput = {
      productName: body.productName,
      whatIsIt: body.whatIsIt,
      whoIsItFor: body.whoIsItFor,
      variations: body.variations,
      personalisation: body.personalisation,
      priceNotes: body.priceNotes,
      postageNotes: body.postageNotes,
    };

    // Validate required fields
    if (!input.productName || typeof input.productName !== 'string' || input.productName.trim() === '') {
      return NextResponse.json({ ok: false, error: 'Product name is required' }, { status: 400 });
    }
    if (!input.whatIsIt || typeof input.whatIsIt !== 'string' || input.whatIsIt.trim() === '') {
      return NextResponse.json({ ok: false, error: 'Product description is required' }, { status: 400 });
    }
    if (!input.whoIsItFor || typeof input.whoIsItFor !== 'string' || input.whoIsItFor.trim() === '') {
      return NextResponse.json({ ok: false, error: 'Target audience is required' }, { status: 400 });
    }
    if (!input.variations || typeof input.variations !== 'string' || input.variations.trim() === '') {
      return NextResponse.json({ ok: false, error: 'Variations field is required' }, { status: 400 });
    }
    if (!input.personalisation || typeof input.personalisation !== 'string' || input.personalisation.trim() === '') {
      return NextResponse.json({ ok: false, error: 'Personalisation field is required' }, { status: 400 });
    }

    // Generate listing assets with OpenAI
    const assets = await generateListingAssets(input);

    // Save to Airtable
    await createAirtableListing(input, assets);

    return NextResponse.json({ ok: true, assets });
  } catch (error) {
    console.error('Generate listing error:', error instanceof Error ? error.message : 'Unknown error');
    
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json(
      { ok: false, error: errorMessage },
      { status: 500 }
    );
  }
}