/**
 * POST /api/auth/logout
 * Logs out user by clearing session cookie
 */

import { NextResponse } from 'next/server';

export async function POST() {
  console.log('[Logout] User logging out');

  const response = NextResponse.json({
    ok: true,
    message: 'Logout successful',
  });

  // Clear the auth cookie
  response.cookies.delete('photos_auth');

  return response;
}
