import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';

/**
 * Test endpoint to verify Supabase connection
 * GET /api/test/db
 * 
 * This endpoint tests the database connection.
 * Remove this in production or protect it with authentication.
 */
export async function GET() {
  try {
    // Test query - try to count videos
    const supabase = getSupabaseAdmin();
    const { data, error, count } = await supabase
      .from('videos')
      .select('*', { count: 'exact', head: true });

    if (error) {
      return NextResponse.json(
        { 
          success: false, 
          error: error.message,
          hint: 'Make sure you have run the database migrations and set up your Supabase credentials in .env.local'
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      tables: {
        videos: count || 0,
      },
      note: 'If you see this, your Supabase connection is working!'
    });
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        hint: 'Check your SUPABASE_SERVICE_ROLE_KEY in .env.local'
      },
      { status: 500 }
    );
  }
}

