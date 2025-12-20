/**
 * POST /api/auth/login
 * Authenticates user with password and sets session cookie
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password } = body;

    // Validate password
    if (!password || typeof password !== 'string') {
      return NextResponse.json(
        { ok: false, error: 'Password is required' },
        { status: 400 }
      );
    }

    const expectedPassword = process.env.PHOTOS_PASSWORD;

    if (!expectedPassword) {
      console.error('[Login] PHOTOS_PASSWORD environment variable not set');
      return NextResponse.json(
        { ok: false, error: 'Authentication not configured' },
        { status: 500 }
      );
    }

    // Check password
    if (password !== expectedPassword) {
      console.log('[Login] Invalid password attempt');
      return NextResponse.json(
        { ok: false, error: 'Invalid password' },
        { status: 401 }
      );
    }

    console.log('[Login] Successful authentication');

    // Generate auth token (same logic as middleware)
    const authToken = `photos_${Buffer.from(expectedPassword).toString('base64')}`;

    // Create response with success
    const response = NextResponse.json({
      ok: true,
      message: 'Login successful',
    });

    // Set secure HTTP-only cookie (24 hour expiry)
    response.cookies.set('photos_auth', authToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours in seconds
      path: '/',
    });

    return response;
  } catch (error: unknown) {
    console.error('[Login] Error:', error);
    return NextResponse.json(
      {
        ok: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
