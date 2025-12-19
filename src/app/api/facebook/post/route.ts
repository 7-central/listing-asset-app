import { NextRequest, NextResponse } from 'next/server';
import { postToFacebookPage } from '@/lib/facebook';
import { updateScheduledSocialPost } from '@/lib/airtable';

/**
 * POST /api/facebook/post
 * Posts a scheduled social media post to Facebook
 *
 * Request body:
 * {
 *   airtableRecordId: string;  // Airtable record ID to update
 *   message: string;            // Post text
 *   imageUrl?: string;          // Optional image URL
 *   scheduledPublishTime?: number; // Optional Unix timestamp for scheduled posts
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { airtableRecordId, message, imageUrl, scheduledPublishTime } = body;

    // Validate required fields
    if (!airtableRecordId) {
      return NextResponse.json(
        {
          ok: false,
          error: 'airtableRecordId is required',
        },
        { status: 400 }
      );
    }

    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        {
          ok: false,
          error: 'message is required and cannot be empty',
        },
        { status: 400 }
      );
    }

    console.log(`[API] Posting to Facebook for record: ${airtableRecordId}`);

    try {
      // Post to Facebook
      const result = await postToFacebookPage(
        message,
        imageUrl,
        scheduledPublishTime
      );

      console.log(`[API] Successfully posted to Facebook: ${result.postUrl}`);

      // Update Airtable record with success
      await updateScheduledSocialPost(airtableRecordId, {
        status: scheduledPublishTime ? 'scheduled' : 'posted',
        postedDateTime: scheduledPublishTime ? undefined : new Date().toISOString(),
        facebookPostId: result.id,
        facebookPostUrl: result.postUrl,
      });

      return NextResponse.json({
        ok: true,
        message: 'Successfully posted to Facebook',
        facebookPostId: result.id,
        facebookPostUrl: result.postUrl,
      });
    } catch (fbError: any) {
      console.error('[API] Facebook posting error:', fbError);

      // Update Airtable record with failure
      await updateScheduledSocialPost(airtableRecordId, {
        status: 'failed',
        errorMessage: fbError.message || 'Unknown Facebook API error',
      });

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
