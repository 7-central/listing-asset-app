import { NextRequest, NextResponse } from 'next/server';
import { fetchProductById } from '@/lib/woocommerce';
import { WooProduct } from '@/lib/types';

// GET /api/woocommerce/products/[id] - Fetch single product with full details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productId = parseInt(id, 10);

    if (isNaN(productId)) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Invalid product ID',
        },
        { status: 400 }
      );
    }

    const rawProduct = await fetchProductById(productId);

    // Map to WooProduct type
    const product: WooProduct = {
      id: rawProduct.id,
      name: rawProduct.name,
      description: rawProduct.description,
      short_description: rawProduct.short_description,
      price: rawProduct.price || rawProduct.regular_price || '0',
      regular_price: rawProduct.regular_price || '0',
      images: (rawProduct.images || []).map((img: any) => ({
        id: img.id,
        src: img.src,
        alt: img.alt || rawProduct.name,
      })),
      categories: (rawProduct.categories || []).map((cat: any) => ({
        id: cat.id,
        name: cat.name,
      })),
      tags: (rawProduct.tags || []).map((tag: any) => ({
        id: tag.id,
        name: tag.name,
      })),
      permalink: rawProduct.permalink || '',
    };

    return NextResponse.json({ ok: true, product });
  } catch (error: any) {
    console.error('[API] Error fetching product:', error);
    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to fetch product',
        details: {
          status: error.status || 500,
          message: error.message || 'Unknown error',
        },
      },
      { status: error.status || 500 }
    );
  }
}
