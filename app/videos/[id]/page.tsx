import { Navigation } from '@/components/navigation';
import { Footer } from '@/components/footer';
import { VideoPlayer } from '@/components/video-player';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';

async function getVideo(id: string) {
  const supabase = getSupabaseAdmin();
  
  const { data, error } = await supabase
    .from('videos')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

interface VideoPageProps {
  params: Promise<{ id: string }>;
}

export default async function VideoPage({ params }: VideoPageProps) {
  const { id } = await params;
  const video = await getVideo(id);

  if (!video || video.status !== 'ready') {
    notFound();
  }

  // Fetch playback ID from Livepeer API
  // We need to get the actual playback ID from the asset
  let playbackId: string | null = null;
  
  try {
    const { getPlaybackInfoFromAsset } = await import('@/lib/video/livepeer-utils');
    
    console.log(`[Video Page] Fetching playback info for video: ${video.id}, asset: ${video.livepeer_asset_id}`);
    
    // Try to get both playback ID and URL from asset
    const { playbackId: fetchedPlaybackId, playbackUrl: fetchedPlaybackUrl } = await getPlaybackInfoFromAsset(video.livepeer_asset_id);
    
    if (fetchedPlaybackId) {
      playbackId = fetchedPlaybackId;
      console.log(`[Video Page] ✅ Successfully retrieved playback ID: ${playbackId} (type: ${typeof playbackId})`);
      if (fetchedPlaybackUrl) {
        console.log(`[Video Page] Also got playback URL: ${fetchedPlaybackUrl.substring(0, 100)}...`);
      }
    } else {
      console.warn(`[Video Page] ⚠️ No playback ID found for asset: ${video.livepeer_asset_id}`);
    }
  } catch (error) {
    console.error('[Video Page] ❌ Error fetching playback ID from Livepeer API:', {
      assetId: video.livepeer_asset_id,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
  }
  
  // Fallback: Use asset ID directly as playback ID
  if (!playbackId) {
    console.warn(`[Video Page] Using fallback - asset ID as playback ID`);
    const cleanAssetId = video.livepeer_asset_id.startsWith('asset-') 
      ? video.livepeer_asset_id.replace('asset-', '')
      : video.livepeer_asset_id;
    
    console.log(`[Video Page] Fallback playback ID: ${cleanAssetId} (type: ${typeof cleanAssetId})`);
    playbackId = cleanAssetId;
  }
  
  // Final validation
  console.log(`[Video Page] Final playback ID being passed to VideoPlayer:`, {
    playbackId,
    type: typeof playbackId,
    isString: typeof playbackId === 'string',
    length: playbackId?.length,
  });

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
      <Navigation />
      
      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <Link
            href="/videos"
            className="mb-6 inline-flex items-center text-sm text-zinc-600 hover:text-black dark:text-zinc-400 dark:hover:text-white"
          >
            ← Back to Videos
          </Link>

          <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-black">
            <h1 className="mb-4 text-3xl font-bold text-black dark:text-white">
              {video.title}
            </h1>
            
            {video.description && (
              <p className="mb-6 text-zinc-600 dark:text-zinc-400">
                {video.description}
              </p>
            )}

            <div className="mb-6">
              {playbackId ? (
                <VideoPlayer
                  playbackId={playbackId}
                  title={video.title}
                  poster={video.thumbnail_url || undefined}
                  showControls={true}
                />
              ) : (
                <div className="flex aspect-video w-full items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-900">
                  <div className="text-center">
                    <p className="text-zinc-600 dark:text-zinc-400">
                      Video is still processing. Please check back in a few moments.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-zinc-200 pt-4 dark:border-zinc-800">
              <div className="text-sm text-zinc-600 dark:text-zinc-400">
                {video.is_free ? (
                  <span className="font-medium text-green-600 dark:text-green-400">
                    Free
                  </span>
                ) : (
                  <span className="font-semibold text-black dark:text-white">
                    ${video.price_usd.toFixed(2)}
                  </span>
                )}
              </div>
              <div className="text-sm text-zinc-600 dark:text-zinc-400">
                {new Date(video.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

