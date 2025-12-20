import { NextRequest, NextResponse } from 'next/server';
import { fetchAllProducts, fetchDraftProducts } from '@/lib/woocommerce';
import { WooProductListItem } from '@/lib/types';

// GET /api/woocommerce/products - Fetch products (published or draft)
// Query params: ?status=draft (optional, defaults to published)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    // Fetch products based on status
    const products = status === 'draft'
      ? await fetchDraftProducts()
      : await fetchAllProducts();

    // Map to simpler format for dropdown
    const productList: WooProductListItem[] = products.map((product) => ({
      id: product.id,
      name: product.name,
      price: product.price || product.regular_price || '0',
      thumbnail: product.images?.[0]?.src || '',
    }));

    return NextResponse.json({ ok: true, products: productList });
  } catch (error: any) {
    console.error('[API] Error fetching products:', error);
    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to fetch products',
        details: {
          status: error.status || 500,
          message: error.message || 'Unknown error',
        },
      },
      { status: error.status || 500 }
    );
  }
}
