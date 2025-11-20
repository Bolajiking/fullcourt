import { Navigation } from '@/components/navigation';
import { Footer } from '@/components/footer';
import { VideoPlayer } from '@/components/video-player';
import { VideoCard } from '@/components/video-card';
import Link from 'next/link';
import { getLivepeerVideos, getLivepeerStreams } from '@/lib/video/livepeer-data';
import { getPlaybackSrc } from '@/lib/video/livepeer-utils';

// Force dynamic rendering for live stream data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function Home() {
  const [videos, streams] = await Promise.all([
    getLivepeerVideos(12),
    getLivepeerStreams(),
  ]);

  const latestStream = streams.find((stream) => stream.isActive) ?? null;

  const latestStreamSrc =
    latestStream?.playbackId
      ? await getPlaybackSrc(latestStream.playbackId)
      : null;
  const isLive = Boolean(latestStream?.isActive && latestStream?.playbackId);

  return (
    <div className="flex min-h-screen flex-col bg-black relative overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-20 right-1/4 w-96 h-96 bg-[#FF6B35] rounded-full filter blur-[128px] animate-pulse"></div>
        <div className="absolute bottom-20 left-1/4 w-96 h-96 bg-[#00D9FF] rounded-full filter blur-[128px] animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-[#B24BF3] rounded-full filter blur-[128px] animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>
      
      <Navigation />
      
      <main className="flex-1 relative z-10">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          {isLive && latestStream && (
            <Link
              href={`/streams/${latestStream.slug}`}
              className="mb-6 flex items-center justify-between rounded-2xl border border-red-500/30 bg-gradient-to-r from-red-600/20 via-red-500/10 to-transparent px-6 py-4 shadow-lg shadow-red-600/30 transition hover:border-red-400/60 hover:shadow-red-500/40"
            >
              <div className="flex items-center gap-4">
                <div className="relative flex h-4 w-4">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75"></span>
                  <span className="relative inline-flex h-4 w-4 rounded-full bg-red-500"></span>
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-red-200">
                    Live now
                  </p>
                  <p className="text-base font-bold text-white">
                    {latestStream.title}
                  </p>
                </div>
              </div>
              <div className="text-sm font-semibold text-white/80">
                Watch →
              </div>
            </Link>
          )}

          {/* Main Content Layout: Stream/Videos on left, Shop on right */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
            {/* Left Column: Livestream + Videos (3/4 width) */}
            <div className="lg:col-span-3 space-y-8">
              {/* Livestream Section */}
              {latestStream && latestStream.isActive ? (
                <div className="rounded-2xl border border-[#FF3366]/30 bg-black/60 backdrop-blur-md p-6 shadow-2xl shadow-[#FF3366]/20 hover:shadow-[#FF3366]/30 transition-all duration-500 animated-border">
                  <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
                    <div>
                      <div className="mb-2 flex items-center gap-3">
                        <span className="relative flex h-4 w-4">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF3366] opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-4 w-4 bg-[#FF3366]"></span>
                        </span>
                        <span className="text-sm font-black text-[#FF3366] uppercase tracking-wider flex items-center gap-2">
                          <span className="text-xl">🔴</span>
                          LIVE NOW
                        </span>
                      </div>
                      <h2 className="text-3xl md:text-4xl font-black text-white drop-shadow-lg">
                        {latestStream.title}
                      </h2>
                      {latestStream.description && (
                        <p className="mt-2 text-lg text-white/80 font-medium">
                          {latestStream.description}
                        </p>
                      )}
                    </div>
                    <Link
                      href={`/streams/${latestStream.slug}`}
                      className="px-8 py-3 rounded-full font-black text-white bg-gradient-to-r from-[#FF3366] to-[#FF6B35] hover:scale-105 transform transition-all duration-300 shadow-lg hover:shadow-[#FF6B35]/50 uppercase tracking-wide border-2 border-white/20"
                    >
                      Watch Live →
                    </Link>
                  </div>
                  <div className="w-full rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10">
                    <VideoPlayer
                      playbackId={latestStream.playbackId ?? latestStream.livepeerStreamId}
                      title={latestStream.title}
                      type="live"
                      showControls={true}
                      autoPlay={false}
                      initialSrc={latestStreamSrc}
                    />
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md p-8 shadow-2xl">
                  <div className="mb-6">
                    <h2 className="text-3xl font-black text-white flex items-center gap-3 drop-shadow-md">
                      <span className="text-4xl">📡</span>
                      Live Stream
                    </h2>
                    <p className="mt-2 text-lg text-white/60">
                      No live streams at the moment
                    </p>
                  </div>
                  <div className="flex aspect-video w-full items-center justify-center rounded-xl bg-black/40 border border-white/5 backdrop-blur-sm">
                    <div className="text-center">
                      <div className="relative inline-block group">
                        <div className="absolute inset-0 bg-gradient-to-r from-[#FF6B35] to-[#00D9FF] opacity-20 blur-xl rounded-full group-hover:opacity-40 transition-opacity"></div>
                        <svg
                          className="relative mx-auto h-20 w-20 text-white/20 group-hover:text-white/40 transition-colors"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                      <p className="mt-6 text-lg font-medium text-white/50">
                        Check back soon for live content
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Videos Grid Section */}
              <div className="rounded-2xl border border-white/5 bg-black/30 backdrop-blur-md p-6 lg:p-8">
                <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <h2 className="text-4xl font-black text-white flex items-center gap-3 drop-shadow-md">
                      <span className="text-5xl">🎬</span>
                      Latest Videos
                    </h2>
                    <p className="mt-2 text-lg text-white/70 font-medium">
                      On-demand highlights and full replays
                    </p>
                  </div>
                  {videos.length > 0 && (
                    <Link
                      href="/videos"
                      className="hidden sm:inline-flex px-6 py-2 rounded-full font-bold text-sm text-white border border-white/20 hover:bg-white/10 transition-colors items-center gap-2"
                    >
                      View All <span className="text-xl">→</span>
                    </Link>
                  )}
                </div>

                {videos.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-white/10 bg-white/5 p-16 text-center">
                    <h3 className="text-2xl font-black text-white">No videos yet</h3>
                    <p className="mt-2 text-white/50">Content is being cooked up! 🏀</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {videos.map((video, index) => (
                      <div
                        key={video.slug}
                        className="animate-fade-in-up"
                        style={{
                          animationDelay: `${index * 50}ms`,
                          opacity: 0,
                        }}
                      >
                        <VideoCard
                          id={video.slug}
                          href={`/videos/${video.slug}`}
                          title={video.title}
                          description={video.description}
                          thumbnailUrl={video.thumbnailUrl}
                          priceUsd={video.priceUsd}
                          isFree={video.isFree}
                          status={video.status}
                        />
                      </div>
                    ))}
                  </div>
                )}
                
                {videos.length > 0 && (
                  <div className="mt-8 text-center sm:hidden">
                    <Link
                      href="/videos"
                      className="inline-block w-full px-6 py-3 rounded-lg font-bold text-white bg-white/10 hover:bg-white/20 border border-white/10 transition-all"
                    >
                      View All Videos →
                    </Link>
                  </div>
                )}
                
                {videos.length >= 6 && (
                   <div className="mt-10 flex justify-center">
                      <Link
                        href="/videos"
                        className="px-10 py-4 rounded-full font-black text-lg text-white bg-gradient-to-r from-[#00D9FF] to-[#B24BF3] hover:scale-105 transform transition-all duration-300 shadow-lg hover:shadow-[#00D9FF]/50 border-2 border-white/20 flex items-center gap-3"
                      >
                        View More Videos <span className="text-2xl">📺</span>
                      </Link>
                   </div>
                )}
              </div>
            </div>

            {/* Right Column: Shop (1/4 width) */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 h-[calc(100vh-120px)] min-h-[500px] rounded-2xl border border-[#B24BF3]/40 bg-black/60 backdrop-blur-md p-8 shadow-2xl shadow-[#B24BF3]/10 flex flex-col relative overflow-hidden group">
                {/* Decorative background inside card */}
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1515523110800-9415d13b84a8?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-overlay transition-transform duration-700 group-hover:scale-110"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/80 to-black"></div>
                
                <div className="relative z-10 flex-1 flex flex-col">
                  <h2 className="text-3xl font-black text-white flex items-center gap-3 drop-shadow-md mb-2">
                    <span className="text-4xl">🛍️</span>
                    Shop
                  </h2>
                  <p className="text-white/60 font-medium">Official Merch</p>
                  
                  <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8 my-8">
                    <div className="relative w-40 h-40 flex items-center justify-center">
                      <div className="absolute inset-0 bg-gradient-to-tr from-[#B24BF3] to-[#FF3366] opacity-30 blur-2xl rounded-full animate-pulse"></div>
                      <div className="relative w-32 h-32 bg-white/5 rounded-full border-2 border-white/10 flex items-center justify-center backdrop-blur-sm transform group-hover:rotate-12 transition-transform duration-500">
                         <span className="text-6xl">👕</span>
                      </div>
                      <div className="absolute -top-2 -right-2 px-3 py-1 bg-[#FF6B35] rounded-full text-xs font-black text-white transform rotate-12 shadow-lg">
                        DROPPING SOON
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-2xl font-black text-white mb-3">
                        Gear Up
                      </h3>
                      <p className="text-white/70 text-sm leading-relaxed">
                        Exclusive jerseys, sneakers, and collectibles coming straight to your door.
                      </p>
                    </div>
                  </div>

                  <div className="w-full bg-white/5 rounded-xl p-4 border border-white/10 backdrop-blur-sm">
                    <div className="flex justify-between text-xs font-bold text-white/40 mb-2 uppercase tracking-wider">
                      <span>Launch Progress</span>
                      <span>85%</span>
                    </div>
                    <div className="w-full h-3 bg-black/50 rounded-full overflow-hidden border border-white/5">
                      <div className="h-full w-[85%] bg-gradient-to-r from-[#FF6B35] via-[#FF3366] to-[#B24BF3] rounded-full relative overflow-hidden">
                        <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite] skew-x-12"></div>
                      </div>
                    </div>
                    <button className="mt-4 w-full py-3 rounded-lg font-bold text-white/40 bg-white/5 border border-white/5 cursor-not-allowed text-xs uppercase tracking-widest hover:bg-white/10 transition-colors">
                      Notify Me
                    </button>
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
