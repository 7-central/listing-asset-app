import { NextResponse } from 'next/server';
import { RoyalMailAdviceRequest } from '@/lib/types';
import { getRoyalMailAdvice } from '@/lib/openai';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Validate required fields
    const input: RoyalMailAdviceRequest = {
      weightGrams: body.weightGrams,
      widthMm: body.widthMm,
      heightMm: body.heightMm,
      depthMm: body.depthMm,
    };

    // Validate that all fields are positive numbers
    if (typeof input.weightGrams !== 'number' || input.weightGrams <= 0) {
      return NextResponse.json({ ok: false, error: 'Weight must be a positive number' }, { status: 400 });
    }
    if (typeof input.widthMm !== 'number' || input.widthMm <= 0) {
      return NextResponse.json({ ok: false, error: 'Width must be a positive number' }, { status: 400 });
    }
    if (typeof input.heightMm !== 'number' || input.heightMm <= 0) {
      return NextResponse.json({ ok: false, error: 'Height must be a positive number' }, { status: 400 });
    }
    if (typeof input.depthMm !== 'number' || input.depthMm <= 0) {
      return NextResponse.json({ ok: false, error: 'Depth must be a positive number' }, { status: 400 });
    }

    // Get Royal Mail advice from AI
    const advice = await getRoyalMailAdvice(input);

    return NextResponse.json({ ok: true, advice });
  } catch (error) {
    console.error('Royal Mail advice error:', error instanceof Error ? error.message : 'Unknown error');

    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json(
      { ok: false, error: errorMessage },
      { status: 500 }
    );
  }
}
