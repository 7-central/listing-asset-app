import { NextRequest, NextResponse } from 'next/server';
import { postToFacebookPage } from '@/lib/facebook';

/**
 * POST /api/facebook/post
 * Posts directly to Facebook Business Page
 *
 * Request body:
 * {
 *   message: string;            // Post text
 *   imageUrl?: string;          // Optional image URL
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, imageUrl } = body;

    // Validate required fields
    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        {
          ok: false,
          error: 'message is required and cannot be empty',
        },
        { status: 400 }
      );
    }

    console.log(`[API] Posting to Facebook...`);

    try {
      // Post to Facebook immediately (no scheduling)
      const result = await postToFacebookPage(message, imageUrl);

      console.log(`[API] Successfully posted to Facebook: ${result.postUrl}`);

      return NextResponse.json({
        ok: true,
        message: 'Successfully posted to Facebook',
        facebookPostId: result.id,
        facebookPostUrl: result.postUrl,
      });
    } catch (fbError: any) {
      console.error('[API] Facebook posting error:', fbError);

      return NextResponse.json(
        {
          ok: false,
          error: 'Failed to post to Facebook',
          details: {
            message: fbError.message || 'Unknown error',
          },
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('[API] Error in Facebook post endpoint:', error);
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
