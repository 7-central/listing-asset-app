/**
 * POST /api/photos/attach
 * Attaches uploaded photos to a WooCommerce product
 */

import { NextRequest, NextResponse } from 'next/server';
import { attachImagesToProduct } from '@/lib/woocommerce';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, imageIds, featuredImageId } = body;

    // Validate required fields
    if (!productId || typeof productId !== 'number') {
      return NextResponse.json(
        { ok: false, error: 'productId is required and must be a number' },
        { status: 400 }
      );
    }

    if (!imageIds || !Array.isArray(imageIds) || imageIds.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'imageIds is required and must be a non-empty array' },
        { status: 400 }
      );
    }

    // Validate all imageIds are numbers
    const allNumbers = imageIds.every((id) => typeof id === 'number');
    if (!allNumbers) {
      return NextResponse.json(
        { ok: false, error: 'All imageIds must be numbers' },
        { status: 400 }
      );
    }

    console.log(
      `[Photos Attach] Attaching ${imageIds.length} images to product ${productId}`
    );

    // Attach images to WooCommerce product
    await attachImagesToProduct(productId, imageIds, featuredImageId);

    console.log(`[Photos Attach] Successfully attached images to product ${productId}`);

    return NextResponse.json({
      ok: true,
      message: 'Images attached successfully',
      productId,
      imageCount: imageIds.length,
    });
  } catch (error: unknown) {
    console.error('[Photos Attach] Error:', error);

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error attaching images';

    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to attach images to product',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
