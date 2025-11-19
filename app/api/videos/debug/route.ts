import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { getPlaybackInfoFromAsset } from '@/lib/video/livepeer-utils';

/**
 * GET /api/videos/debug
 * Debug endpoint to check video status and playback information
 */
export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    
    // Fetch all videos
    const { data: videos, error } = await supabase
      .from('videos')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // For each video, fetch playback info from Livepeer
    const videosWithPlaybackInfo = await Promise.all(
      (videos || []).map(async (video) => {
        let playbackInfo = null;
        let error = null;

        try {
          playbackInfo = await getPlaybackInfoFromAsset(video.livepeer_asset_id);
        } catch (e: any) {
          error = e.message || String(e);
        }

        return {
          id: video.id,
          title: video.title,
          status: video.status,
          livepeer_asset_id: video.livepeer_asset_id,
          has_thumbnail: !!video.thumbnail_url,
          thumbnail_is_base64: video.thumbnail_url?.startsWith('data:'),
          thumbnail_url_preview: video.thumbnail_url?.substring(0, 100),
          created_at: video.created_at,
          playbackInfo,
          error,
        };
      })
    );

    return NextResponse.json({
      total: videos?.length || 0,
      videos: videosWithPlaybackInfo,
    });
  } catch (error) {
    console.error('[Video Debug] Error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : String(error),
      },
      { status: 500 }
    );
  }
}

