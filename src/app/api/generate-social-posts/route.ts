import { NextRequest, NextResponse } from 'next/server';
import { generateSocialMediaPosts } from '@/lib/openai';
import { GenerateSocialPostsRequest } from '@/lib/types';

// POST /api/generate-social-posts - Generate 5 social media posts from product data
export async function POST(request: NextRequest) {
  try {
    const body: GenerateSocialPostsRequest = await request.json();

    // Validate required fields
    if (!body.productId || !body.productName || !body.description) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Missing required fields: productId, productName, and description are required',
        },
        { status: 400 }
      );
    }

    if (!body.imageUrls || body.imageUrls.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          error: 'At least one product image is required',
        },
        { status: 400 }
      );
    }

    console.log(`[API] Generating social posts for product: ${body.productName}`);

    const response = await generateSocialMediaPosts(body);

    return NextResponse.json({
      ok: true,
      posts: response.posts,
    });
  } catch (error: any) {
    console.error('[API] Error generating social posts:', error);
    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to generate social media posts',
        details: {
          message: error.message || 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}
