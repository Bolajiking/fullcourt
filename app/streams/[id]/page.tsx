import { Navigation } from '@/components/navigation';
import { Footer } from '@/components/footer';
import { VideoPlayer } from '@/components/video-player';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getLivepeerStreamBySlug } from '@/lib/video/livepeer-data';
import { getPlaybackSrc } from '@/lib/video/livepeer-utils';

interface StreamPageProps {
  params: Promise<{ id: string }>;
}

export default async function StreamPage({ params }: StreamPageProps) {
  const { id } = await params;
  const stream = await getLivepeerStreamBySlug(id);

  if (!stream) {
    notFound();
  }

  const playbackId = stream.playbackId ?? stream.livepeerStreamId;
  const playbackSrc = playbackId ? await getPlaybackSrc(playbackId) : null;

  return (
    <div className="flex min-h-screen flex-col bg-black">
      <Navigation />
      
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <Link
            href="/streams"
            className="mb-6 inline-flex items-center text-sm text-zinc-400 hover:text-white transition-colors"
          >
            ← Back to Streams
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Video Player - Left Column (2/3 width on desktop) */}
            <div className="lg:col-span-2">
              <div className="rounded-xl overflow-hidden bg-gradient-to-br from-black to-[#0a0a0a] border border-white/10 shadow-2xl">
                {playbackId ? (
                  <VideoPlayer
                    playbackId={playbackId}
                    title={stream.title}
                    type="live"
                    showControls={true}
                    autoPlay={stream.isActive}
                    initialSrc={playbackSrc}
                  />
                ) : (
                  <div className="flex aspect-video w-full items-center justify-center bg-zinc-900">
                    <div className="text-center">
                      <svg
                        className="mx-auto h-16 w-16 text-zinc-600"
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
                      <p className="mt-4 text-lg font-medium text-zinc-400">
                        Stream is offline
                      </p>
                      <p className="mt-2 text-sm text-zinc-500">
                        The stream will appear here when it goes live
                      </p>
                    </div>
                  </div>
                )}
                
                {/* Stream Info Below Player */}
                <div className="p-6 border-t border-white/10">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {stream.isActive && (
                          <div className="flex items-center gap-2 rounded-full bg-red-600 px-3 py-1">
                            <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
                            <span className="text-xs font-bold text-white uppercase tracking-wider">
                              Live
                            </span>
                          </div>
                        )}
                        {!stream.isActive && stream.recordEnabled && (
                          <div className="rounded-full bg-zinc-800 px-3 py-1">
                            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                              Recorded
                            </span>
                          </div>
                        )}
                      </div>
                      <h1 className="text-2xl font-bold text-white mb-2">
                        {stream.title}
                      </h1>
                      {stream.description && (
                        <p className="text-zinc-400 leading-relaxed">
                          {stream.description}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      {stream.isFree ? (
                        <span className="inline-flex items-center rounded-lg bg-green-500/10 px-3 py-1.5 text-sm font-semibold text-green-400 border border-green-500/20">
                          Free
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-lg bg-gradient-to-r from-orange-500/10 to-red-500/10 px-4 py-1.5 text-lg font-bold text-white border border-orange-500/20">
                          ${stream.priceUsd.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-zinc-500 pt-4 border-t border-white/5">
                    {stream.createdAt && (
                      <span>Started {new Date(stream.createdAt).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Live Chat & Interaction - Right Column (1/3 width on desktop) */}
            <div className="lg:col-span-1">
              <div className="rounded-xl bg-gradient-to-br from-black to-[#0a0a0a] border border-white/10 shadow-2xl p-6 sticky top-4">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <svg 
                    className="w-5 h-5 text-orange-500" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" 
                    />
                  </svg>
                  Live Chat
                </h2>
                
                {/* Placeholder for live chat - will be implemented in next phase */}
                <div className="flex items-center justify-center h-[400px] rounded-lg bg-zinc-900/50 border border-zinc-800">
                  <div className="text-center px-6">
                    <svg 
                      className="mx-auto h-12 w-12 text-zinc-600 mb-3" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" 
                      />
                    </svg>
                    <p className="text-sm font-medium text-zinc-400 mb-1">
                      Live Chat Coming Soon
                    </p>
                    <p className="text-xs text-zinc-600">
                      Connect with other viewers in real-time
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

