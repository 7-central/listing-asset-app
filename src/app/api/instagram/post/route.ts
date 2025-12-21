import { NextRequest, NextResponse } from 'next/server';
import { postToInstagram } from '@/lib/instagram';

/**
 * POST /api/instagram/post
 * Posts directly to Instagram Business Account
 *
 * Request body:
 * {
 *   caption: string;      // Post caption (max 2,200 chars)
 *   imageUrl: string;     // Public HTTPS URL of image
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { caption, imageUrl } = body;

    // Validate required fields
    if (!caption || caption.trim().length === 0) {
      return NextResponse.json(
        {
          ok: false,
          error: 'caption is required and cannot be empty',
        },
        { status: 400 }
      );
    }

    if (!imageUrl || !imageUrl.startsWith('http')) {
      return NextResponse.json(
        {
          ok: false,
          error: 'imageUrl is required and must be a valid HTTP/HTTPS URL',
        },
        { status: 400 }
      );
    }

    console.log(`[API] Posting to Instagram...`);

    try {
      // Post to Instagram (2-step process: create container, then publish)
      const result = await postToInstagram(caption, imageUrl);

      console.log(`[API] Successfully posted to Instagram: ${result.postUrl}`);

      return NextResponse.json({
        ok: true,
        message: 'Successfully posted to Instagram',
        instagramPostId: result.id,
        instagramPostUrl: result.postUrl,
      });
    } catch (igError: any) {
      console.error('[API] Instagram posting error:', igError);

      return NextResponse.json(
        {
          ok: false,
          error: 'Failed to post to Instagram',
          details: {
            message: igError.message || 'Unknown error',
          },
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('[API] Error in Instagram post endpoint:', error);
    return NextResponse.json(
      {
        ok: false,
        error: 'Internal server error',
        details: {
          message: error.message || 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}
