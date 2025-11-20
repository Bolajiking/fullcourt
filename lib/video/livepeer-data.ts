import { unstable_cache } from 'next/cache';
import { Livepeer } from 'livepeer';
import { serverEnv } from '@/lib/env';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { getLivepeerAsset, getPlaybackInfoFromAsset, getLivepeerStream } from '@/lib/video/livepeer-utils';

type SupabaseVideoRow = {
  id: string;
  title: string;
  description: string | null;
  livepeer_asset_id: string;
  thumbnail_url: string | null;
  price_usd: number;
  is_free: boolean;
  status: string;
  created_at: string;
  updated_at: string;
};

type SupabaseStreamRow = {
  id: string;
  title: string;
  description: string | null;
  livepeer_stream_id: string;
  playback_id: string | null;
  rtmp_ingest_url: string;
  stream_key: string;
  is_live: boolean;
  record_enabled: boolean | null;
  price_usd: number;
  is_free: boolean;
  created_at: string;
  updated_at: string;
};

export interface LivepeerVideoRecord {
  slug: string;
  livepeerAssetId: string;
  supabaseId?: string;
  title: string;
  description?: string;
  thumbnailUrl?: string | null;
  playbackId?: string | null;
  status: 'ready' | 'processing' | 'error';
  isFree: boolean;
  priceUsd: number;
  createdAt: string;
  metadata?: SupabaseVideoRow;
}

export interface LivepeerStreamRecord {
  slug: string;
  livepeerStreamId: string;
  supabaseId?: string;
  title: string;
  description?: string;
  isActive: boolean;
  playbackId?: string | null;
  playbackUrl?: string | null;
  recordEnabled: boolean;
  isFree: boolean;
  priceUsd: number;
  createdAt?: string;
  metadata?: SupabaseStreamRow;
}

function getLivepeerClient() {
  if (!serverEnv.livepeerApiKey) {
    throw new Error('Livepeer API key not configured');
  }
  return new Livepeer({
    apiKey: serverEnv.livepeerApiKey,
  });
}

function extractPlaybackId(asset: any): string | null {
  if (!asset) return null;
  const playbackIds = asset.playbackIds || asset.playbackId || asset.data?.playbackIds;
  if (Array.isArray(playbackIds) && playbackIds.length > 0) {
    const first = playbackIds[0];
    return typeof first === 'string' ? first : first?.id ?? null;
  }
  if (playbackIds && typeof playbackIds === 'object' && playbackIds.id) {
    return playbackIds.id;
  }
  if (typeof playbackIds === 'string') {
    return playbackIds;
  }
  return asset.playbackId ?? null;
}

function getAssetThumbnail(asset: any): string | null {
  // Check all possible thumbnail locations from Livepeer response
  const apiThumbnail = 
    asset?.thumbnailUrl ||
    asset?.thumbnail?.url ||
    asset?.preview?.image?.url ||
    asset?.preview?.images?.[0]?.url;
  
  // If API doesn't provide thumbnail, use Livepeer's standard thumbnail endpoint
  if (apiThumbnail) {
    return apiThumbnail;
  }
  
  // Fallback to Livepeer's standard thumbnail endpoint if asset has ID
  if (asset?.id) {
    return `https://lp-assets.livepeer.studio/api/asset/${asset.id}/thumbnail.jpg`;
  }
  
  return null;
}

async function fetchLivepeerAssetsViaApi(): Promise<any[]> {
  if (!serverEnv.livepeerApiKey) {
    return [];
  }
  try {
    const response = await fetch('https://livepeer.studio/api/asset', {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${serverEnv.livepeerApiKey}`,
      },
      cache: 'no-store',
    });
    if (!response.ok) {
      const text = await response.text();
      console.warn(`Livepeer asset list warning: ${response.status} ${response.statusText} ${text}`);
      return [];
    }
    const json = await response.json();
    const assets: any[] =
      Array.isArray(json)
        ? json
        : json?.assets ||
          json?.data ||
          [];
    return assets;
  } catch (error) {
    console.error('[Livepeer Data] Asset API fallback error:', error);
    return [];
  }
}

const fetchLivepeerAssets = unstable_cache(
  async () => {
    const livepeer = getLivepeerClient();
    try {
      if (typeof livepeer.asset.getAll === 'function') {
        const result: any = await livepeer.asset.getAll();
        const assets: any[] =
          Array.isArray(result)
            ? result
            : result?.assets ||
              result?.data ||
              [];
        return assets;
      }
      return await fetchLivepeerAssetsViaApi();
    } catch (error) {
      console.error('[Livepeer Data] Error fetching assets via SDK, attempting REST fallback:', error);
      return await fetchLivepeerAssetsViaApi();
    }
  },
  ['livepeer-assets'],
  { revalidate: 60 }
);

const fetchLivepeerStreamsRaw = unstable_cache(
  async () => {
    if (!serverEnv.livepeerApiKey) {
      throw new Error('Livepeer API key not configured');
    }
    try {
      const response = await fetch('https://livepeer.studio/api/stream', {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${serverEnv.livepeerApiKey}`,
        },
        cache: 'no-store',
      });
      if (!response.ok) {
        const text = await response.text();
        console.warn(`Livepeer stream list warning: ${response.status} ${response.statusText} ${text}`);
        return [];
      }
      const json = await response.json();
      const streams: any[] =
        Array.isArray(json)
          ? json
          : json?.streams ||
            json?.data ||
            [];
      return streams;
    } catch (error) {
      console.error('[Livepeer Data] Error fetching streams:', error);
      return [];
    }
  },
  ['livepeer-streams'],
  { revalidate: 30 }
);

export const getLivepeerVideos = unstable_cache(
  async (limit = 12): Promise<LivepeerVideoRecord[]> => {
    const assets = await fetchLivepeerAssets();
    if (!assets.length) return [];

    const readyAssets = assets.filter((asset) => {
      const phase = asset?.status?.phase || asset?.status;
      return phase === 'ready' || phase === 'completed';
    });

    const sortedAssets = readyAssets.sort((a, b) => {
      const aTs = (a?.createdAt || 0) * 1000;
      const bTs = (b?.createdAt || 0) * 1000;
      return bTs - aTs;
    });

    const limited = sortedAssets.slice(0, limit);
    const assetIds = limited.map((asset) => asset.id).filter(Boolean);

    let metadataMap = new Map<string, SupabaseVideoRow>();
    if (assetIds.length) {
      const supabase = getSupabaseAdmin();
      const { data } = await supabase
        .from('videos')
        .select('*')
        .in('livepeer_asset_id', assetIds);
      if (data) {
        metadataMap = new Map(data.map((row) => [row.livepeer_asset_id, row]));
      }
    }

    // Filter out assets that don't have Supabase metadata
    // This ensures we only show "managed" videos in the main grid,
    // hiding raw stream recordings that haven't been processed/uploaded via our UI
    const managedAssets = limited.filter(asset => metadataMap.has(asset.id));

    return managedAssets.map((asset) => {
      const metadata = metadataMap.get(asset.id);
      const playbackId = extractPlaybackId(asset);
      const createdAt =
        metadata?.created_at ||
        (asset?.createdAt ? new Date(asset.createdAt * 1000).toISOString() : new Date().toISOString());
      return {
        slug: asset.id,
        livepeerAssetId: asset.id,
        supabaseId: metadata?.id,
        title: metadata?.title ?? asset.name ?? 'Untitled Video',
        description: metadata?.description ?? asset.description ?? '',
        thumbnailUrl: metadata?.thumbnail_url ?? getAssetThumbnail(asset),
        playbackId,
        status: 'ready',
        isFree: metadata?.is_free ?? true,
        priceUsd: metadata?.price_usd ?? 0,
        createdAt,
        metadata,
      };
    });
  },
  ['livepeer-videos'],
  { revalidate: 60 }
);

export async function getLivepeerVideoBySlug(slug: string): Promise<LivepeerVideoRecord | null> {
  const supabase = getSupabaseAdmin();

  let metadata: SupabaseVideoRow | null = null;
  let assetId = slug;

  const { data: byId } = await supabase
    .from('videos')
    .select('*')
    .eq('id', slug)
    .maybeSingle();

  if (byId) {
    metadata = byId;
    assetId = byId.livepeer_asset_id;
  } else {
    const { data: byAsset } = await supabase
      .from('videos')
      .select('*')
      .eq('livepeer_asset_id', slug)
      .maybeSingle();
    if (byAsset) {
      metadata = byAsset;
      assetId = byAsset.livepeer_asset_id;
    }
  }

  try {
    const asset = await getLivepeerAsset(assetId);
    const { playbackId } = await getPlaybackInfoFromAsset(assetId);
    return {
      slug: asset.id,
      livepeerAssetId: asset.id,
      supabaseId: metadata?.id,
      title: metadata?.title ?? asset.name ?? 'Untitled Video',
      description: metadata?.description ?? asset.description ?? '',
      thumbnailUrl: metadata?.thumbnail_url ?? getAssetThumbnail(asset),
      playbackId: playbackId ?? extractPlaybackId(asset),
      status: (asset?.status?.phase || asset?.status || 'processing') as 'ready' | 'processing' | 'error',
      isFree: metadata?.is_free ?? true,
      priceUsd: metadata?.price_usd ?? 0,
      createdAt:
        metadata?.created_at ||
        (asset?.createdAt ? new Date(asset.createdAt * 1000).toISOString() : new Date().toISOString()),
      metadata: metadata ?? undefined,
    };
  } catch (error) {
    console.error('[Livepeer Data] getLivepeerVideoBySlug error:', error);
    return null;
  }
}

export const getLivepeerStreams = unstable_cache(
  async (): Promise<LivepeerStreamRecord[]> => {
    const supabase = getSupabaseAdmin();
    
    // Fetch with error handling to prevent whole page crash
    const streamsRaw = await fetchLivepeerStreamsRaw();
    
    // Always fetch DB rows even if Livepeer API fails partially
    const { data: supRows } = await supabase.from('streams').select('*');

    let metadataMap = new Map<string, SupabaseStreamRow>();
    if (supRows) {
      metadataMap = new Map(supRows.map((row) => [row.livepeer_stream_id, row]));
    }

    // If Livepeer API completely failed (empty array), try to reconstruct from DB rows
    // This ensures we at least show SOMETHING if the API is down or keys are invalid
    let effectiveStreams: any[] = streamsRaw;
    
    if (streamsRaw.length === 0 && supRows && supRows.length > 0) {
      // Map DB rows to mock stream objects
      effectiveStreams = supRows.map((row) => ({
        id: row.livepeer_stream_id,
        name: row.title,
        isActive: row.is_live, // Trust DB state if API fails
        playbackId: row.playback_id,
        createdAt: new Date(row.created_at).getTime() / 1000,
      }));
    }

    const resolvedStreams = await Promise.all(
      effectiveStreams.map(async (stream: any) => {
      const metadata = metadataMap.get(stream.id);
        let playbackId =
          stream.playbackId ||
          stream.playback?.id ||
          stream.playback_ids?.[0] ||
          metadata?.playback_id ||
          null;
        if (!playbackId) {
          try {
            const livepeerStream = await getLivepeerStream(stream.id);
            playbackId = livepeerStream?.playbackId || null;
            if (playbackId && metadata?.id) {
              await supabase
                .from('streams')
                .update({ playback_id: playbackId })
                .eq('id', metadata.id);
              metadata.playback_id = playbackId;
            }
          } catch (error) {
            console.warn('[Livepeer Data] Unable to resolve playback ID for stream', stream.id, error);
          }
        }
      const recordEnabled =
        metadata?.record_enabled ??
        (typeof stream.record === 'boolean' ? stream.record : true);
      const playbackUrl =
        stream.playbackUrl ||
        stream.playback?.hls ||
        stream.playback?.url ||
        null;
        
      // Prioritize Livepeer API 'isActive' status if available, fallback to DB
      const isActive = stream.isActive !== undefined 
        ? Boolean(stream.isActive) 
        : Boolean(metadata?.is_live);

      return {
        slug: stream.id,
        livepeerStreamId: stream.id,
        supabaseId: metadata?.id,
        title: metadata?.title ?? stream.name ?? 'Livestream',
        description: metadata?.description ?? '',
        isActive,
        recordEnabled,
        playbackId,
        playbackUrl,
        isFree: metadata?.is_free ?? true,
        priceUsd: metadata?.price_usd ?? 0,
        createdAt: metadata?.created_at ?? (stream.createdAt ? new Date(stream.createdAt * 1000).toISOString() : undefined),
        metadata: metadata ?? undefined,
      };
      })
    );
    return resolvedStreams;
  },
  ['livepeer-streams-combined'],
  { revalidate: 5 }
);

export const getRecordedSessions = unstable_cache(
  async (limit = 12): Promise<LivepeerVideoRecord[]> => {
    const assets = await fetchLivepeerAssets();
    if (!assets.length) return [];

    const readyAssets = assets.filter((asset) => {
      const phase = asset?.status?.phase || asset?.status;
      return phase === 'ready' || phase === 'completed';
    });

    // Sort by creation time (newest first)
    const sortedAssets = readyAssets.sort((a, b) => {
      const aTs = (a?.createdAt || 0) * 1000;
      const bTs = (b?.createdAt || 0) * 1000;
      return bTs - aTs;
    });

    // We want to find assets that are NOT in the videos table
    // These are likely recorded sessions
    
    // Optimisation: Fetch all known video asset IDs from Supabase
    // This is more efficient than checking chunks if we want accuracy
    const supabase = getSupabaseAdmin();
    const { data: allVideoIds } = await supabase
      .from('videos')
      .select('livepeer_asset_id');
      
    const existingVideoIds = new Set<string>(
      (allVideoIds || []).map(v => v.livepeer_asset_id).filter(Boolean)
    );

    // Filter for assets NOT in Supabase videos table
    const recordedSessions = sortedAssets
      .filter((asset) => !existingVideoIds.has(asset.id))
      .slice(0, limit);

    return recordedSessions.map((asset) => {
      const playbackId = extractPlaybackId(asset);
      const createdAt = asset?.createdAt 
        ? new Date(asset.createdAt * 1000).toISOString() 
        : new Date().toISOString();
        
      return {
        slug: asset.id,
        livepeerAssetId: asset.id,
        title: asset.name ?? 'Recorded Session',
        description: 'Past livestream recording',
        thumbnailUrl: getAssetThumbnail(asset),
        playbackId,
        status: 'ready',
        isFree: true, // Recordings are free by default unless we add logic
        priceUsd: 0,
        createdAt,
      };
    });
  },
  ['livepeer-recorded-sessions'],
  { revalidate: 60 }
);

export async function getLivepeerStreamBySlug(slug: string): Promise<LivepeerStreamRecord | null> {
  const supabase = getSupabaseAdmin();
  let metadata: SupabaseStreamRow | null = null;
  let livepeerStreamId = slug;

  const { data: byId } = await supabase
    .from('streams')
    .select('*')
    .eq('id', slug)
    .maybeSingle();

  if (byId) {
    metadata = byId;
    livepeerStreamId = byId.livepeer_stream_id;
  } else {
    const { data: byStream } = await supabase
      .from('streams')
      .select('*')
      .eq('livepeer_stream_id', slug)
      .maybeSingle();
    if (byStream) {
      metadata = byStream;
      livepeerStreamId = byStream.livepeer_stream_id;
    }
  }

  try {
    let stream = await getLivepeerStream(livepeerStreamId);
    
    // If not found as a stream, try to find it as a recorded session (Asset)
    if (!stream) {
      try {
        const asset = await getLivepeerAsset(slug);
        if (asset) {
           const playbackId = extractPlaybackId(asset);
           return {
             slug: asset.id,
             livepeerStreamId: asset.id, // Using asset ID as stream ID for compatibility
             supabaseId: undefined,
             title: asset.name ?? 'Recorded Session',
             description: 'Past livestream recording',
             isActive: false,
             recordEnabled: false,
             playbackId,
             playbackUrl: null,
             isFree: true,
             priceUsd: 0,
             createdAt: asset.createdAt ? new Date(asset.createdAt * 1000).toISOString() : undefined,
           };
        }
      } catch (assetError) {
        // Not an asset either, proceed to metadata fallback
      }
    }

    const playbackId =
      stream?.playbackId ||
      metadata?.playback_id ||
      null;
    const playbackUrl = null; // Playback URL is constructed from playbackId when needed
    const recordEnabled =
      metadata?.record_enabled ??
      (typeof stream?.record === 'boolean' ? stream.record : true);

    return {
      slug: stream?.id ?? slug,
      livepeerStreamId: stream?.id ?? livepeerStreamId,
      supabaseId: metadata?.id,
      title: metadata?.title ?? stream?.name ?? 'Livestream',
      description: metadata?.description ?? '',
      isActive: Boolean(stream?.isActive ?? metadata?.is_live),
      recordEnabled,
      playbackId,
      playbackUrl,
      isFree: metadata?.is_free ?? true,
      priceUsd: metadata?.price_usd ?? 0,
      createdAt: metadata?.created_at ?? (stream?.createdAt ? new Date(stream.createdAt * 1000).toISOString() : undefined),
      metadata: metadata ?? undefined,
    };
  } catch (error) {
    console.error('[Livepeer Data] getLivepeerStreamBySlug error:', error);
    if (metadata) {
      return {
        slug: metadata.id,
        livepeerStreamId: metadata.livepeer_stream_id,
        supabaseId: metadata.id,
        title: metadata.title,
        description: metadata.description ?? '',
        isActive: Boolean(metadata.is_live),
        recordEnabled: metadata.record_enabled ?? true,
        playbackId: metadata.playback_id,
        playbackUrl: null,
        isFree: metadata.is_free,
        priceUsd: metadata.price_usd,
        createdAt: metadata.created_at,
        metadata,
      };
    }
    return null;
  }
}
