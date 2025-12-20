/**
 * POST /api/photos/attach
 * Attaches photos to a WooCommerce product using image URLs
 * WooCommerce will download and import the images automatically
 */

import { NextRequest, NextResponse } from 'next/server';
import { attachImagesByUrlToProduct } from '@/lib/woocommerce';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, images } = body;

    // Validate required fields
    if (!productId || typeof productId !== 'number') {
      return NextResponse.json(
        { ok: false, error: 'productId is required and must be a number' },
        { status: 400 }
      );
    }

    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'images is required and must be a non-empty array' },
        { status: 400 }
      );
    }

    // Validate all images have src property
    const allValid = images.every((img) => img.src && typeof img.src === 'string');
    if (!allValid) {
      return NextResponse.json(
        { ok: false, error: 'All images must have a src property' },
        { status: 400 }
      );
    }

    console.log(
      `[Photos Attach] Attaching ${images.length} images to product ${productId}`
    );

    // Attach images to WooCommerce product by URL
    await attachImagesByUrlToProduct(productId, images);

    console.log(`[Photos Attach] Successfully attached images to product ${productId}`);

    return NextResponse.json({
      ok: true,
      message: 'Images attached successfully',
      productId,
      imageCount: images.length,
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
