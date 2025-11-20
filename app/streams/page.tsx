import { Navigation } from '@/components/navigation';
import { Footer } from '@/components/footer';
import { getLivepeerStreams, getRecordedSessions } from '@/lib/video/livepeer-data';
import Link from 'next/link';
import { VideoPlayer } from '@/components/video-player';
import { getPlaybackSrc } from '@/lib/video/livepeer-utils';

// Force dynamic rendering since we fetch live stream data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function StreamsPage() {
  const streams = await getLivepeerStreams();
  const activeStream = streams.find((stream) => stream.isActive && stream.playbackId);
  
  // Fetch recorded sessions that are NOT managed in the videos table
  // These are the raw recordings from past livestreams
  const recordedSessions = await getRecordedSessions(12);
  
  const activeStreamSrc =
    activeStream?.playbackId ? await getPlaybackSrc(activeStream.playbackId) : null;

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
      <Navigation />
      
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-black dark:text-white">
              Live Streams
            </h1>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              Watch live content from creators
            </p>
          </div>

          {!activeStream ? (
            <div className="rounded-lg border border-zinc-200 bg-white p-12 text-center dark:border-zinc-800 dark:bg-black">
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
              <h3 className="mt-4 text-lg font-semibold text-black dark:text-white">
                No live streams
              </h3>
              <p className="mt-2 text-zinc-600 dark:text-zinc-400">
                Check back soon for live content!
              </p>
            </div>
          ) : (
            <div className="mb-12 rounded-xl border border-red-500/30 bg-gradient-to-br from-black to-[#0a0a0a] p-6 shadow-2xl shadow-red-500/20">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="mb-2 flex items-center gap-3">
                    <span className="relative flex h-4 w-4">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500"></span>
                    </span>
                    <span className="text-sm font-black text-red-400 uppercase tracking-wider">
                      Live now
                    </span>
                  </div>
                  <h2 className="text-3xl font-black text-white">{activeStream.title}</h2>
                  {activeStream.description && (
                    <p className="mt-2 text-white/70">{activeStream.description}</p>
                  )}
                </div>
                <Link
                  href={`/streams/${activeStream.slug}`}
                  className="px-5 py-3 rounded-lg font-semibold text-white bg-gradient-to-r from-red-500 to-orange-500 hover:scale-105 transition-transform"
                >
                  View Details →
                </Link>
              </div>
              <div className="rounded-xl overflow-hidden border border-white/10">
                <VideoPlayer
                  playbackId={activeStream.playbackId ?? activeStream.livepeerStreamId}
                  title={activeStream.title}
                  type="live"
                  showControls
                  initialSrc={activeStreamSrc}
                />
              </div>
            </div>
          )}

          <div className="mt-8">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-black dark:text-white">
                  Recorded Sessions
                </h2>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  Replays from past livestreams
                </p>
              </div>
            </div>

            {recordedSessions.length === 0 ? (
              <div className="rounded-lg border border-zinc-200 bg-white p-10 text-center dark:border-zinc-800 dark:bg-black">
                <p className="text-zinc-600 dark:text-zinc-400">
                  No recorded sessions yet. Enable “Record this session” when starting a stream to
                  keep replays.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {recordedSessions.map((session) => (
                  <Link
                    key={session.slug}
                    href={`/streams/${session.slug}`}
                    className="group relative overflow-hidden rounded-lg bg-white shadow-sm transition-shadow hover:shadow-md dark:bg-black"
                  >
                    <div className="relative aspect-video w-full bg-zinc-100 dark:bg-zinc-900">
                      {!session.isFree && (
                        <div className="absolute right-2 top-2 rounded-md bg-black/80 px-2 py-1 text-xs font-medium text-white z-10">
                          ${session.priceUsd.toFixed(2)}
                        </div>
                      )}
                      {session.thumbnailUrl ? (
                         <div
                          className="h-full w-full bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                          style={{ backgroundImage: `url(${session.thumbnailUrl})` }}
                        >
                          <div className="h-full w-full bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                        </div>
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-zinc-800">
                           <span className="text-zinc-500">No Preview</span>
                        </div>
                      )}
                      
                      {/* Play Button Overlay */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                        <div className="rounded-full bg-red-600 p-3 shadow-lg transform transition-transform duration-300 hover:scale-110">
                          <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="line-clamp-2 text-lg font-semibold text-black group-hover:text-red-600 transition-colors dark:text-white dark:group-hover:text-red-500">
                        {session.title}
                      </h3>
                      {session.createdAt && (
                        <p className="mt-2 text-xs text-zinc-500">
                          Recorded {new Date(session.createdAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
