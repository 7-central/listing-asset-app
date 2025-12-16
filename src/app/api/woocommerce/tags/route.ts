import { NextRequest, NextResponse } from 'next/server';
import { fetchAllTags, createTag } from '@/lib/woocommerce';

// GET /api/woocommerce/tags - Fetch all tags
export async function GET() {
  try {
    const tags = await fetchAllTags();
    return NextResponse.json({ ok: true, tags });
  } catch (error: any) {
    console.error('[API] Error fetching tags:', error);
    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to fetch tags',
        details: {
          status: error.status || 500,
          message: error.message || 'Unknown error',
        },
      },
      { status: error.status || 500 }
    );
  }
}

// POST /api/woocommerce/tags - Create a new tag
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        {
          ok: false,
          error: 'Tag name is required and must be a string',
        },
        { status: 400 }
      );
    }

    const tag = await createTag(name);
    return NextResponse.json({ ok: true, tag });
  } catch (error: any) {
    console.error('[API] Error creating tag:', error);
    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to create tag',
        details: {
          status: error.status || 500,
          message: error.message || 'Unknown error',
        },
      },
      { status: error.status || 500 }
    );
  }
}
