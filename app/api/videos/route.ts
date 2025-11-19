import { NextRequest, NextResponse } from 'next/server';
import { getLivepeerVideos } from '@/lib/video/livepeer-data';

/**
 * GET /api/videos
 * Get all videos (public endpoint)
 */
export async function GET() {
  try {
    const videos = await getLivepeerVideos(100);
    return NextResponse.json({ videos });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/videos
 * Create a new video (admin only - should add auth check)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, livepeer_asset_id, price_usd, is_free, thumbnail_url } = body;

    if (!title || !livepeer_asset_id) {
      return NextResponse.json(
        { error: 'Title and livepeer_asset_id are required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    
    const { data, error } = await supabase
      .from('videos')
      .insert({
        title,
        description: description || null,
        livepeer_asset_id,
        price_usd: price_usd || 0,
        is_free: is_free !== undefined ? is_free : true,
        thumbnail_url: thumbnail_url || null,
        status: 'processing',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ video: data }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

