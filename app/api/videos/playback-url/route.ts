import { NextRequest, NextResponse } from 'next/server';
import { getPlaybackUrl, getPlaybackInfoFromAsset } from '@/lib/video/livepeer-utils';

/**
 * GET /api/videos/playback-url?playbackId={playbackId}
 * Fetches the actual playback URL from Livepeer API
 * 
 * Accepts either:
 * - A playback ID (short string like "c266jdxxnqeipqpx")
 * - An asset ID (UUID like "c26606e4-3b0f-4724-a180-2029b2c98bae")
 * 
 * If an asset ID is provided, it will fetch the asset first to get the playback ID.
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const playbackIdOrAssetId = searchParams.get('playbackId');
    
    console.log('[Playback URL API] Request received:', { playbackIdOrAssetId });
    
    if (!playbackIdOrAssetId) {
      return NextResponse.json(
        { error: 'playbackId is required' },
        { status: 400 }
      );
    }
    
    // Check if this looks like an asset ID (UUID format)
    const isAssetId = playbackIdOrAssetId.includes('-') && playbackIdOrAssetId.length > 20;
    
    let actualPlaybackId = playbackIdOrAssetId;
    let playbackUrl: string | null = null;
    
    if (isAssetId) {
      console.log('[Playback URL API] Detected asset ID, fetching playback info from asset:', playbackIdOrAssetId);
      try {
        const { playbackId, playbackUrl: urlFromAsset } = await getPlaybackInfoFromAsset(playbackIdOrAssetId);
        
        if (playbackId) {
          actualPlaybackId = playbackId;
          console.log('[Playback URL API] Extracted playback ID from asset:', actualPlaybackId);
          
          // If we got the URL from the asset, use it
          if (urlFromAsset) {
            console.log('[Playback URL API] Got playback URL from asset:', urlFromAsset.substring(0, 100));
            return NextResponse.json({ playbackUrl: urlFromAsset });
          }
        } else {
          console.warn('[Playback URL API] Could not extract playback ID from asset:', playbackIdOrAssetId);
        }
      } catch (assetError: any) {
        console.warn('[Playback URL API] Error fetching asset:', {
          error: assetError?.message || String(assetError),
        });
        // Continue to try using the ID directly as playback ID
      }
    }
    
    // Try to get playback URL using the (possibly extracted) playback ID
    console.log('[Playback URL API] Fetching playback URL for:', actualPlaybackId);
    playbackUrl = await getPlaybackUrl(actualPlaybackId);
    
    if (!playbackUrl) {
      console.warn('[Playback URL API] getPlaybackUrl returned null for:', actualPlaybackId);
      return NextResponse.json(
        { 
          error: 'Could not fetch playback URL from Livepeer',
          playbackId: actualPlaybackId,
          originalId: playbackIdOrAssetId,
          note: isAssetId 
            ? 'Tried to extract playback ID from asset but could not get playback URL.'
            : 'Could not fetch playback URL for this playback ID.',
        },
        { status: 404 }
      );
    }
    
    console.log('[Playback URL API] Successfully fetched playback URL:', playbackUrl.substring(0, 100));
    return NextResponse.json({ playbackUrl });
  } catch (error) {
    console.error('[Playback URL API] Error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : String(error),
      },
      { status: 500 }
    );
  }
}

