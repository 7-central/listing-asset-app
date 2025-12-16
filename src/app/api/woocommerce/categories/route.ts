import { NextRequest, NextResponse } from 'next/server';
import { fetchAllCategories, createCategory } from '@/lib/woocommerce';

// GET /api/woocommerce/categories - Fetch all categories
export async function GET() {
  try {
    const categories = await fetchAllCategories();
    return NextResponse.json({ ok: true, categories });
  } catch (error: any) {
    console.error('[API] Error fetching categories:', error);
    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to fetch categories',
        details: {
          status: error.status || 500,
          message: error.message || 'Unknown error',
        },
      },
      { status: error.status || 500 }
    );
  }
}

// POST /api/woocommerce/categories - Create a new category
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        {
          ok: false,
          error: 'Category name is required and must be a string',
        },
        { status: 400 }
      );
    }

    const category = await createCategory(name);
    return NextResponse.json({ ok: true, category });
  } catch (error: any) {
    console.error('[API] Error creating category:', error);
    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to create category',
        details: {
          status: error.status || 500,
          message: error.message || 'Unknown error',
        },
      },
      { status: error.status || 500 }
    );
  }
}
