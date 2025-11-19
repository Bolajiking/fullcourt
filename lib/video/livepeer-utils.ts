import { serverEnv } from '@/lib/env';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { Livepeer } from 'livepeer';

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
export async function getLivepeerAsset(assetId: string) {
  const livepeer = getLivepeerClient();
  
  // Try the asset ID as-is first (SDK should handle the format)
  // If that fails with 500, the asset might not exist or be invalid
  try {
    // Use SDK's asset.get method - pass asset ID as-is
    // The SDK should handle the correct format internally
    const result = await livepeer.asset.get(assetId);
    
    // SDK v3.5.0 returns: { asset: {...} } or { data: { asset: {...} } }
    // Handle different response structures
    const asset = result.asset || result.data?.asset || result.data;
    
    if (!asset) {
      console.error('[Livepeer Asset] No asset found in response:', {
        assetId,
        resultKeys: Object.keys(result),
        resultType: typeof result,
        fullResult: JSON.stringify(result).substring(0, 500),
      });
      throw new Error(`Asset not found: ${assetId}`);
    }
    
    // Log asset structure for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log('[Livepeer Asset] Successfully fetched:', {
        assetId,
        hasAsset: !!result.asset,
        hasData: !!result.data,
        hasPlaybackIds: !!asset.playbackIds,
        playbackIdsLength: asset.playbackIds?.length || 0,
        status: asset.status?.phase || asset.status,
      });
    }
    
    return asset;
  } catch (error: any) {
    // Enhanced error logging with SDK error details
    const errorInfo: any = {
      assetId,
      errorType: error?.constructor?.name || typeof error,
      errorMessage: error?.message || String(error),
    };
    
    // SDK errors may have additional properties
    if (error?.status) errorInfo.status = error.status;
    if (error?.statusText) errorInfo.statusText = error.statusText;
    if (error?.statusCode) errorInfo.statusCode = error.statusCode;
    
    // Try to extract error details from SDK error
    if (error?.body) {
      try {
        // Limit error body to first 500 chars to avoid huge logs
        const errorBodyStr = typeof error.body === 'string' 
          ? error.body 
          : JSON.stringify(error.body);
        errorInfo.errorBody = errorBodyStr.substring(0, 500);
      } catch {
        errorInfo.errorBody = 'Could not stringify error body';
      }
    }
    
    // For 500 errors, the asset might not exist or Livepeer API is having issues
    // For 404 errors, the asset definitely doesn't exist
    if (error?.status === 404 || error?.statusCode === 404) {
      console.warn('[Livepeer Asset] Asset not found (404):', errorInfo);
      throw new Error(`Asset not found: ${assetId}`);
    }
    
    if (error?.status === 500 || error?.statusCode === 500) {
      console.error('[Livepeer Asset] Livepeer API error (500):', errorInfo);
      // For 500 errors, the asset might not exist yet or there's an API issue
      // We'll throw the error but the caller can handle it gracefully
      throw new Error(`Livepeer API error: Asset ${assetId} may not exist or API is unavailable`);
    }
    
    console.error('[Livepeer Asset] Error fetching asset:', errorInfo);
    throw error;
  }
}

/**
 * Get playback info from playback ID using Livepeer SDK
 * This matches the working implementation pattern
 * Returns the full playback info object with sources
 */
export async function getPlaybackInfo(playbackId: string): Promise<any | null> {
  try {
    console.log(`[Playback Info] Fetching playback info for: ${playbackId}`);
    const livepeer = getLivepeerClient();
    
    // Use Livepeer SDK to get playback info (like the working example)
    const result = await livepeer.playback.get(playbackId);
    
    if (!result.playbackInfo) {
      console.error('[Playback Info] Error fetching playback info', result);
      return null;
    }
    
    console.log('[Playback Info] Successfully fetched playback info:', {
      hasPlaybackInfo: !!result.playbackInfo,
      hasMeta: !!result.playbackInfo?.meta,
      hasSource: !!(result.playbackInfo?.meta?.source),
    });
    
    return result.playbackInfo;
  } catch (error: any) {
    console.error('[Playback Info] Error:', {
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
    const sources = playbackInfo.meta?.source || [];
    
    if (!Array.isArray(sources) || sources.length === 0) {
      console.warn('[Playback URL] No sources found in playback info');
      return null;
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
    return null;
  } catch (error: any) {
    console.error('[Playback URL] Error fetching playback URL:', {
      playbackId,
      error: error?.message || String(error),
    });
    return null;
  }
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
    
    // SDK returns: { asset: {...} } or { data: { asset: {...} } }
    return result.asset || result.data?.asset || result.data || result;
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
    const thumbnailUrl = asset.thumbnailUrl || 
                         asset.thumbnail?.url || 
                         asset.data?.thumbnailUrl ||
                         asset.data?.thumbnail?.url;
    
    if (thumbnailUrl) {
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
    
    // SDK returns: { stream: {...} } or { data: { stream: {...} } }
    return result.stream || result.data?.stream || result.data || result;
  } catch (error: any) {
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
    const isLive = stream.isActive || stream.stream?.isActive || false;

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

