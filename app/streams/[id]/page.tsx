import { Navigation } from '@/components/navigation';
import { Footer } from '@/components/footer';
import { VideoPlayer } from '@/components/video-player';
import { getSupabase } from '@/lib/supabase/client';
import { notFound } from 'next/navigation';
import Link from 'next/link';

async function getStream(id: string) {
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from('streams')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

interface StreamPageProps {
  params: Promise<{ id: string }>;
}

export default async function StreamPage({ params }: StreamPageProps) {
  const { id } = await params;
  const stream = await getStream(id);

  if (!stream) {
    notFound();
  }

  // Get playback ID from Livepeer stream ID
  // In production, you might want to store playback ID separately or fetch from Livepeer API
  // For now, we'll use the stream ID directly (Livepeer playback IDs are different)
  // Note: You may need to fetch the stream from Livepeer API to get the actual playback ID
  const playbackId = stream.livepeer_stream_id;

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
      <Navigation />
      
      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <Link
            href="/streams"
            className="mb-6 inline-flex items-center text-sm text-zinc-600 hover:text-black dark:text-zinc-400 dark:hover:text-white"
          >
            ← Back to Streams
          </Link>

          <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-black">
            <div className="mb-4 flex items-center justify-between">
              <h1 className="text-3xl font-bold text-black dark:text-white">
                {stream.title}
              </h1>
              {stream.is_live && (
                <div className="flex items-center gap-2 rounded-md bg-red-600 px-3 py-1">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
                  <span className="text-sm font-medium text-white">LIVE</span>
                </div>
              )}
            </div>
            
            {stream.description && (
              <p className="mb-6 text-zinc-600 dark:text-zinc-400">
                {stream.description}
              </p>
            )}

            <div className="mb-6">
              {stream.is_live ? (
                <VideoPlayer
                  playbackId={playbackId}
                  title={stream.title}
                  type="live"
                  showControls={true}
                />
              ) : (
                <div className="flex aspect-video w-full items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-900">
                  <div className="text-center">
                    <svg
                      className="mx-auto h-12 w-12 text-zinc-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                    <p className="mt-4 text-lg font-medium text-zinc-600 dark:text-zinc-400">
                      Stream is offline
                    </p>
                    <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-500">
                      The stream will appear here when it goes live
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-zinc-200 pt-4 dark:border-zinc-800">
              <div className="text-sm text-zinc-600 dark:text-zinc-400">
                {stream.is_free ? (
                  <span className="font-medium text-green-600 dark:text-green-400">
                    Free
                  </span>
                ) : (
                  <span className="font-semibold text-black dark:text-white">
                    ${stream.price_usd.toFixed(2)}
                  </span>
                )}
              </div>
              <div className="text-sm text-zinc-600 dark:text-zinc-400">
                Created {new Date(stream.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

