import { NextRequest, NextResponse } from 'next/server';
import { isAdmin } from '@/lib/auth/admin-utils';

/**
 * GET /api/auth/check-admin?user_id=...
 * Check if a user is an admin
 * Note: In production, you should verify the user is authenticated via Privy
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json(
        { error: 'user_id parameter is required' },
        { status: 400 }
      );
    }

    const admin = isAdmin(userId);

    return NextResponse.json({ isAdmin: admin });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

