import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';

/**
 * GET /api/profile
 * Get user profile by Privy user ID
 * Note: In production, you should verify the user is authenticated
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const privyUserId = searchParams.get('user_id');

    if (!privyUserId) {
      return NextResponse.json(
        { error: 'user_id parameter is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('privy_user_id', privyUserId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found - return null
        return NextResponse.json({ profile: null });
      }
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ profile: data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/profile
 * Create or update user profile
 * Note: In production, you should verify the user is authenticated and matches the user_id
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { privy_user_id, email, display_name, avatar_url } = body;

    if (!privy_user_id) {
      return NextResponse.json(
        { error: 'privy_user_id is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    
    // Check if profile exists
    const { data: existing } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('privy_user_id', privy_user_id)
      .single();

    if (existing) {
      // Update existing profile
      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          email: email || null,
          display_name: display_name || null,
          avatar_url: avatar_url || null,
        })
        .eq('privy_user_id', privy_user_id)
        .select()
        .single();

      if (error) {
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({ profile: data });
    } else {
      // Create new profile
      const { data, error } = await supabase
        .from('user_profiles')
        .insert({
          privy_user_id,
          email: email || null,
          display_name: display_name || null,
          avatar_url: avatar_url || null,
        })
        .select()
        .single();

      if (error) {
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({ profile: data }, { status: 201 });
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

