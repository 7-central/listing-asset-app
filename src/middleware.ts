/**
 * Next.js Middleware
 * Protects the /photos routes with password authentication
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect /photos routes and /api/photos routes
  const isPhotosPage = pathname.startsWith('/photos') && pathname !== '/photos/login';
  const isPhotosApi = pathname.startsWith('/api/photos');

  if (!isPhotosPage && !isPhotosApi) {
    return NextResponse.next();
  }

  // Check for authentication cookie
  const authCookie = request.cookies.get('photos_auth');

  if (!authCookie) {
    // No auth cookie - redirect to login
    if (isPhotosPage) {
      const loginUrl = new URL('/photos/login', request.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // API route - return 401
    return NextResponse.json(
      { ok: false, error: 'Unauthorized - Please login' },
      { status: 401 }
    );
  }

  // Verify the auth cookie value
  const expectedToken = generateAuthToken();

  if (authCookie.value !== expectedToken) {
    // Invalid token - clear cookie and redirect/return error
    const response = isPhotosPage
      ? NextResponse.redirect(new URL('/photos/login', request.url))
      : NextResponse.json(
          { ok: false, error: 'Invalid authentication token' },
          { status: 401 }
        );

    response.cookies.delete('photos_auth');
    return response;
  }

  // Valid authentication - proceed
  return NextResponse.next();
}

/**
 * Generate authentication token from password
 * Simple hash - good enough for internal tool with single shared password
 */
function generateAuthToken(): string {
  const password = process.env.PHOTOS_PASSWORD || '';

  if (!password) {
    console.warn('[Middleware] PHOTOS_PASSWORD not set - authentication disabled');
    return 'disabled';
  }

  // Simple hash of password (not cryptographically secure, but fine for internal tool)
  // In production, you'd use bcrypt or similar
  const hash = Buffer.from(password).toString('base64');
  return `photos_${hash}`;
}

export const config = {
  matcher: ['/photos/:path*', '/api/photos/:path*'],
};
