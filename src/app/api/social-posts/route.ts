import { NextRequest, NextResponse } from 'next/server';
import {
  createScheduledSocialPosts,
  fetchScheduledSocialPosts,
} from '@/lib/airtable';
import { ScheduledSocialPost } from '@/lib/types';

// GET /api/social-posts - Fetch all scheduled social posts
export async function GET() {
  try {
    const posts = await fetchScheduledSocialPosts();
    return NextResponse.json({ ok: true, posts });
  } catch (error: any) {
    console.error('[API] Error fetching scheduled posts:', error);
    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to fetch scheduled posts',
        details: {
          message: error.message || 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}

// POST /api/social-posts - Save scheduled social posts
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { posts }: { posts: Omit<ScheduledSocialPost, 'id'>[] } = body;

    if (!Array.isArray(posts) || posts.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Posts array is required and must not be empty',
        },
        { status: 400 }
      );
    }

    // Validate each post
    for (const post of posts) {
      if (!post.postText || !post.productName || !post.scheduledDateTime) {
        return NextResponse.json(
          {
            ok: false,
            error:
              'Each post must have postText, productName, and scheduledDateTime',
          },
          { status: 400 }
        );
      }
    }

    console.log(`[API] Scheduling ${posts.length} social posts`);

    await createScheduledSocialPosts(posts);

    return NextResponse.json({
      ok: true,
      message: `Successfully scheduled ${posts.length} posts`,
    });
  } catch (error: any) {
    console.error('[API] Error scheduling posts:', error);
    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to schedule posts',
        details: {
          message: error.message || 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}
