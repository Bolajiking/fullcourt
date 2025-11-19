import { NextRequest, NextResponse } from 'next/server';
import { updateVideoStatusFromLivepeer } from '@/lib/video/livepeer-utils';
import { getSupabaseAdmin } from '@/lib/supabase/server';

/**
 * POST /api/videos/[id]/update-status
 * Updates video status by checking Livepeer asset status
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Get video from database to get livepeer_asset_id
    const supabase = getSupabaseAdmin();
    const { data: video, error: videoError } = await supabase
      .from('videos')
      .select('livepeer_asset_id')
      .eq('id', id)
      .single();

    if (videoError || !video) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      );
    }

    if (!video.livepeer_asset_id) {
      return NextResponse.json(
        { error: 'Video has no Livepeer asset ID' },
        { status: 400 }
      );
    }

    // Update status from Livepeer
    try {
      const result = await updateVideoStatusFromLivepeer(id, video.livepeer_asset_id);

      // Get updated video
      const { data: updatedVideo, error: fetchError } = await supabase
        .from('videos')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) {
        return NextResponse.json(
          { error: 'Failed to fetch updated video' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        video: updatedVideo,
        status: result.status,
      });
    } catch (updateError) {
      console.error('[Update Status] Error updating video status:', updateError);
      // Return current video status even if update failed
      const { data: currentVideo } = await supabase
        .from('videos')
        .select('*')
        .eq('id', id)
        .single();
      
      return NextResponse.json({
        success: false,
        video: currentVideo,
        error: updateError instanceof Error ? updateError.message : 'Update failed',
      });
    }
  } catch (error) {
    console.error('Error updating video status:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

