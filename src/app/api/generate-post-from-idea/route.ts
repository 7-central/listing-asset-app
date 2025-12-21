import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/generate-post-from-idea
 * Generates a social media post from a short text idea
 *
 * Request body:
 * {
 *   idea: string;  // User's short idea for the post
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { idea } = body;

    // Validate required field
    if (!idea || idea.trim().length === 0) {
      return NextResponse.json(
        {
          ok: false,
          error: 'idea is required and cannot be empty',
        },
        { status: 400 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is not set');
    }

    console.log(`[API] Generating social post from idea: "${idea.substring(0, 50)}..."`);

    const prompt = `You are a social media marketing expert for a handmade crafts business. The user has provided a short idea for a Facebook post. Your task is to expand this into a compelling, engaging Facebook post.

User's idea: "${idea}"

Create an engaging Facebook post based on this idea. The post should:
- Be warm, friendly, and conversational
- Be between 100-200 words
- Include relevant emojis where appropriate (but not too many)
- End with a call-to-action or engaging question
- Be formatted for Facebook (use line breaks for readability)

Return ONLY the post text, no JSON, no explanations, just the ready-to-post text.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Anthropic API error: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    const data = await response.json();

    if (!data.content?.[0]?.text) {
      throw new Error('No content returned from Anthropic API');
    }

    const generatedPost = data.content[0].text.trim();

    console.log(`[API] Successfully generated post (${generatedPost.length} chars)`);

    return NextResponse.json({
      ok: true,
      post: generatedPost,
    });
  } catch (error: any) {
    console.error('[API] Error generating post from idea:', error);
    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to generate post',
        details: {
          message: error.message || 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}
