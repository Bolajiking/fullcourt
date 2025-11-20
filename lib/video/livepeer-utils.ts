import { serverEnv } from '@/lib/env';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { Livepeer } from 'livepeer';
import { getSrc } from '@livepeer/react/external';
import type { Src } from '@livepeer/react';

const buildHlsSrc = (url: string): Src =>
  ({
    src: url,
    type: 'application/vnd.apple.mpegurl',
  } as unknown as Src);

/**
 * Livepeer API utilities
 * Helper functions for interacting with Livepeer API using the Livepeer SDK
 */

/**
 * Get initialized Livepeer SDK client
 */
function getLivepeerClient() {
  if (!serverEnv.livepeerApiKey) {
    throw new Error('Livepeer API key not configured');
  }
  return new Livepeer({
    apiKey: serverEnv.livepeerApiKey,
  });
}

/**
 * Get asset details from Livepeer by asset ID using the SDK
 * Returns the asset with playback information
 * 
 * Note: Livepeer SDK v3.5.0 uses asset.get() method
 * Asset IDs can be used as-is (they may or may not have 'asset-' prefix)
 */
async function fetchLivepeerAssetViaRest(assetId: string) {
  if (!serverEnv.livepeerApiKey) {
    throw new Error('Livepeer API key not configured');
  }
  const response = await fetch(`https://livepeer.studio/api/asset/${assetId}`, {
    headers: {
      Authorization: `Bearer ${serverEnv.livepeerApiKey}`,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Livepeer REST asset error ${response.status}: ${body}`);
  }
  const data = await response.json();
  return data?.asset || data?.data || data;
}

export async function getLivepeerAsset(assetId: string) {
  const livepeer = getLivepeerClient();
  
  try {
    const result = await livepeer.asset.get(assetId);
    const asset = result.asset;
    
    if (!asset) {
      throw new Error(`Asset not found: ${assetId}`);
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[Livepeer Asset] Successfully fetched via SDK:', {
        assetId,
        hasPlaybackId: !!asset.playbackId,
        playbackId: asset.playbackId,
        status: asset.status?.phase || asset.status,
      });
    }
    
    return asset;
  } catch (error: any) {
    console.warn('[Livepeer Asset] SDK fetch failed, attempting REST fallback:', {
      assetId,
      error: error?.message || error,
    });
    
    try {
      const asset = await fetchLivepeerAssetViaRest(assetId);
      if (process.env.NODE_ENV === 'development') {
        console.log('[Livepeer Asset] Successfully fetched via REST fallback:', {
          assetId,
          hasPlaybackIds: !!asset?.playbackIds,
          status: asset?.status?.phase || asset?.status,
        });
      }
      return asset;
    } catch (restError) {
      console.error('[Livepeer Asset] REST fallback failed:', {
        assetId,
        error: restError instanceof Error ? restError.message : restError,
      });
      throw restError;
    }
  }
}

/**
 * Get playback info from playback ID using Livepeer SDK
 * This matches the working implementation pattern
 * Returns the full playback info object with sources
 */
export async function getPlaybackInfo(playbackId: string): Promise<any | null> {
  if (!serverEnv.livepeerApiKey) {
    console.warn('[Playback Info] Missing Livepeer API key');
    return null;
  }

  try {
    const response = await fetch(`https://livepeer.studio/api/playback/${playbackId}`, {
      headers: {
        Authorization: `Bearer ${serverEnv.livepeerApiKey}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('[Playback Info] Livepeer playback API error:', response.status, text);
      return null;
    }

    const playbackInfo = await response.json();

    if (!playbackInfo) {
      console.warn('[Playback Info] Empty playback response for', playbackId);
      return null;
    }

    return playbackInfo;
  } catch (error: any) {
    console.error('[Playback Info] Error fetching playback info:', {
      playbackId,
      error: error?.message || String(error),
    });
    return null;
  }
}

/**
 * Get playback URL from playback ID
 * Fetches the actual playback URL from Livepeer API using the SDK
 * Returns null if the video is not ready or URL cannot be fetched
 */
export async function getPlaybackUrl(playbackId: string): Promise<string | null> {
  try {
    const playbackInfo = await getPlaybackInfo(playbackId);
    
    if (!playbackInfo) {
      console.warn('[Playback URL] No playback info available');
      return null;
    }
    
    // Extract HLS URL from playback info
    const sources =
      playbackInfo.meta?.source ||
      playbackInfo.meta?.sources ||
      playbackInfo.source ||
      playbackInfo.sources ||
      [];
    
    if (!Array.isArray(sources) || sources.length === 0) {
      console.warn('[Playback URL] No sources found in playback info');
      return `https://livepeercdn.com/hls/${playbackId}/index.m3u8`;
    }
    
    // Find HLS source (SDK returns 'url' not 'src')
    const hlsSource = sources.find((s: any) => 
      s.type === 'html5/application/vnd.apple.mpegurl' || 
      s.type?.includes('mpegurl') ||
      s.type?.includes('m3u8') ||
      s.url?.includes('.m3u8')
    );
    
    if (hlsSource?.url) {
      console.log(`[Playback URL] Found HLS URL: ${hlsSource.url.substring(0, 100)}...`);
      return hlsSource.url;
    }
    
    // Fallback: Use first source with url property
    const firstSourceWithUrl = sources.find((s: any) => s.url);
    if (firstSourceWithUrl?.url) {
      console.log(`[Playback URL] Using first available source: ${firstSourceWithUrl.url.substring(0, 100)}...`);
      return firstSourceWithUrl.url;
    }
    
    console.warn('[Playback URL] No usable source found');
    return `https://livepeercdn.com/hls/${playbackId}/index.m3u8`;
  } catch (error: any) {
    console.error('[Playback URL] Error fetching playback URL:', {
      playbackId,
      error: error?.message || String(error),
    });
    // Last resort fallback to CDN pattern
    return `https://livepeercdn.com/hls/${playbackId}/index.m3u8`;
  }
}

export async function getPlaybackSrc(playbackId: string): Promise<Src[] | null> {
  const playbackInfo = await getPlaybackInfo(playbackId);
  if (playbackInfo) {
    try {
      const src = getSrc(playbackInfo);
      if (Array.isArray(src) && src.length > 0) {
        return src;
      }
    } catch (error) {
      console.warn('[Playback Src] getSrc failed, falling back to CDN URL:', error);
    }
  }

  const fallbackUrl = `https://livepeercdn.studio/hls/${playbackId}/index.m3u8`;
  return [buildHlsSrc(fallbackUrl)];
}

/**
 * Get playback ID and URL from asset ID
 * Fetches the asset and extracts both the playback ID and the playback URL if available
 * Returns both for convenience
 */
export async function getPlaybackInfoFromAsset(assetId: string): Promise<{ playbackId: string | null; playbackUrl: string | null }> {
  try {
    const asset = await getLivepeerAsset(assetId);
    
    // Livepeer assets have playbackIds array - check multiple possible structures
    const playbackIds = asset.playbackIds || 
                         asset.data?.playbackIds ||
                         asset.playbackId || // Sometimes it's a single object
                         asset.data?.playbackId;
    
    let extractedPlaybackId: string | null = null;
    
    // Handle array of playback IDs
    if (Array.isArray(playbackIds) && playbackIds.length > 0) {
      // Each playback ID can be an object with id property or a string
      const firstPlaybackId = playbackIds[0];
      extractedPlaybackId = typeof firstPlaybackId === 'string' 
        ? firstPlaybackId 
        : firstPlaybackId?.id || null;
    }
    // Handle single playback ID object
    else if (playbackIds && typeof playbackIds === 'object' && playbackIds.id) {
      extractedPlaybackId = playbackIds.id;
    }
    // Handle string playback ID
    else if (typeof playbackIds === 'string') {
      extractedPlaybackId = playbackIds;
    }
    
    if (extractedPlaybackId) {
      console.log(`[Playback Info] Extracted playback ID: ${extractedPlaybackId} from asset: ${assetId}`);
      
      // Try to get playback URL if we have the playback ID
      let playbackUrl: string | null = null;
      try {
        playbackUrl = await getPlaybackUrl(extractedPlaybackId);
      } catch (urlError) {
        console.warn('[Playback Info] Could not get playback URL:', urlError);
      }
      
      return { playbackId: extractedPlaybackId, playbackUrl };
    }
    
    console.warn('[Playback Info] No playback ID found in asset:', {
      assetId,
      assetKeys: Object.keys(asset),
      hasPlaybackIds: !!asset.playbackIds,
      assetStatus: asset.status?.phase || asset.status,
    });
    
    return { playbackId: null, playbackUrl: null };
  } catch (error: any) {
    // Enhanced error logging with SDK error details
    const errorInfo: any = {
      assetId,
      errorType: error?.constructor?.name || typeof error,
      errorMessage: error?.message || String(error),
      errorStack: error?.stack,
    };
    
    // SDK errors may have additional properties
    if (error?.status) errorInfo.status = error.status;
    if (error?.statusText) errorInfo.statusText = error.statusText;
    
    console.error('[Playback Info] Error getting playback info:', errorInfo);
    return { playbackId: null, playbackUrl: null };
  }
}

/**
 * Get playback ID from asset ID
 * Fetches the asset and extracts the playback ID
 * Handles different Livepeer response structures
 */
export async function getPlaybackIdFromAsset(assetId: string): Promise<string | null> {
  const { playbackId } = await getPlaybackInfoFromAsset(assetId);
  return playbackId;
}

/**
 * Create a new asset in Livepeer using the SDK
 * Uploads video metadata (actual video upload is done separately)
 */
export async function createLivepeerAsset(name: string) {
  try {
    const livepeer = getLivepeerClient();
    const result = await livepeer.asset.create({ name });
    
    // SDK returns: { data: { asset: {...} } }
    if (!result.data) {
      throw new Error('No data returned from Livepeer');
    }
    return result.data.asset;
  } catch (error: any) {
    console.error('Error creating Livepeer asset:', {
      name,
      error: error?.message || String(error),
      status: error?.status,
      statusText: error?.statusText,
    });
    throw error;
  }
}

/**
 * Update video status in Supabase based on Livepeer asset status
 */
export async function updateVideoStatusFromLivepeer(
  videoId: string,
  livepeerAssetId: string
) {
  try {
    const asset = await getLivepeerAsset(livepeerAssetId);
    const supabase = getSupabaseAdmin();

    let status: 'processing' | 'ready' | 'error' = 'processing';
    
    // Check multiple possible status locations in the response
    const assetStatus = asset.status || asset.data?.status || {};
    const phase = assetStatus.phase || assetStatus.status;
    
    if (phase === 'ready' || phase === 'completed') {
      status = 'ready';
    } else if (phase === 'failed' || phase === 'error') {
      status = 'error';
    }

    const updateData: any = { status };
    
    // Update thumbnail if available (check multiple possible locations)
    const apiThumbnailUrl = asset.thumbnailUrl || 
                            asset.thumbnail?.url || 
                            asset.data?.thumbnailUrl ||
                            asset.data?.thumbnail?.url;
    
    // Use API thumbnail if available, otherwise construct Livepeer's standard thumbnail URL
    const thumbnailUrl = apiThumbnailUrl || `https://lp-assets.livepeer.studio/api/asset/${livepeerAssetId}/thumbnail.jpg`;
    
    // Only update thumbnail_url if it's currently null/empty in the DB
    // This prevents overwriting user-provided custom thumbnails
    const { data: currentVideo } = await supabase
      .from('videos')
      .select('thumbnail_url')
      .eq('id', videoId)
      .single();
    
    if (!currentVideo?.thumbnail_url || currentVideo.thumbnail_url.startsWith('data:')) {
      // Update if no thumbnail exists, or if it's a base64 that should be replaced
      updateData.thumbnail_url = thumbnailUrl;
    }

    // Extract and log playback ID for debugging
    const playbackIds = asset.playbackIds || asset.data?.playbackIds;
    if (playbackIds && Array.isArray(playbackIds) && playbackIds.length > 0) {
      const playbackId = typeof playbackIds[0] === 'string' 
        ? playbackIds[0] 
        : playbackIds[0]?.id;
      
      if (playbackId) {
        console.log(`[Status Update] Video ${videoId} has playback ID: ${playbackId}`);
        // Note: We could store playback ID in a separate column if needed
        // For now, we fetch it dynamically when displaying videos
      }
    }

    const { error } = await supabase
      .from('videos')
      .update(updateData)
      .eq('id', videoId);

    if (error) {
      console.error('Error updating video status:', error);
      throw error;
    }

    console.log(`[Status Update] Video ${videoId} status updated to: ${status}`);
    return { status, asset };
  } catch (error) {
    console.error('Error updating video status from Livepeer:', error);
    throw error;
  }
}

/**
 * Get stream details from Livepeer by stream ID using the SDK
 */
export async function getLivepeerStream(streamId: string) {
  try {
    const livepeer = getLivepeerClient();
    const result = await livepeer.stream.get(streamId);
    
    // SDK returns: { stream: {...} }
    return result.stream || null;
  } catch (error: any) {
    // Suppress 404 errors as they are expected when checking if an ID is a stream vs asset
    if (error?.status === 404 || error?.message?.includes('not found') || error?.body?.errors?.[0] === 'not found') {
      return null;
    }

    console.error('Error fetching Livepeer stream:', {
      streamId,
      error: error?.message || String(error),
      status: error?.status,
      statusText: error?.statusText,
    });
    throw error;
  }
}

/**
 * Update stream status in Supabase based on Livepeer stream status
 */
export async function updateStreamStatusFromLivepeer(
  streamId: string,
  livepeerStreamId: string
) {
  try {
    const stream = await getLivepeerStream(livepeerStreamId);
    const supabase = getSupabaseAdmin();

    // Check if stream is live
    // Livepeer streams have an `isActive` property or similar
    const isLive = stream?.isActive || false;

    const { error } = await supabase
      .from('streams')
      .update({ is_live: isLive })
      .eq('id', streamId);

    if (error) {
      console.error('Error updating stream status:', error);
      throw error;
    }

    return { isLive, stream };
  } catch (error) {
    console.error('Error updating stream status from Livepeer:', error);
    throw error;
  }
}

/**
 * Delete an asset from Livepeer
 */
export async function deleteLivepeerAsset(assetId: string) {
  try {
    const livepeer = getLivepeerClient();
    await livepeer.asset.delete(assetId);
    console.log(`[Livepeer] Deleted asset: ${assetId}`);
    return true;
  } catch (error: any) {
    console.error('Error deleting Livepeer asset:', {
      assetId,
      error: error?.message || String(error),
    });
    throw error;
  }
}

