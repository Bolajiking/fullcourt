import { Navigation } from '@/components/navigation';
import { Footer } from '@/components/footer';
import { VideoPlayer } from '@/components/video-player';
import { VideoCard } from '@/components/video-card';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import Link from 'next/link';

async function getLatestLiveStream() {
  const supabase = getSupabaseAdmin();
  
  // Get the latest live stream (prioritize live ones, then most recent)
  const { data, error } = await supabase
    .from('streams')
    .select('*')
    .order('is_live', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data;
}

async function getVideos() {
  const supabase = getSupabaseAdmin();
  
  // Fetch all videos with status 'ready'
  // Only show ready videos on public page
  const { data, error } = await supabase
    .from('videos')
    .select('*')
    .eq('status', 'ready')
    .order('created_at', { ascending: false })
    .limit(12);

  if (error) {
    console.error('Error fetching videos:', error);
    return [];
  }

  return data || [];
}

export default async function Home() {
  const [latestStream, videos] = await Promise.all([
    getLatestLiveStream(),
    getVideos(),
  ]);

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
          {/* Main Content Layout: Stream/Videos on left, Shop on right */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
            {/* Left Column: Livestream + Videos (3/4 width) */}
            <div className="lg:col-span-3">
              {/* Livestream Section */}
              {latestStream && latestStream.is_live ? (
                <div className="mb-8 rounded-xl border border-[#FF3366]/30 bg-gradient-to-br from-black to-[#0a0a0a] p-6 shadow-2xl shadow-[#FF3366]/20 hover:shadow-[#FF3366]/30 transition-all duration-500 animated-border">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <div className="mb-3 flex items-center gap-3">
                        <span className="relative flex h-4 w-4">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF3366] opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-4 w-4 bg-[#FF3366]"></span>
                        </span>
                        <span className="text-sm font-black text-[#FF3366] uppercase tracking-wider flex items-center gap-2">
                          <span className="text-xl">🔴</span>
                          LIVE NOW
                        </span>
                      </div>
                      <h2 className="text-3xl font-black gradient-text">
                        {latestStream.title}
                      </h2>
                      {latestStream.description && (
                        <p className="mt-2 text-base text-white/60">
                          {latestStream.description}
                        </p>
                      )}
                    </div>
                    <Link
                      href={`/streams/${latestStream.id}`}
                      className="px-6 py-3 rounded-lg font-bold text-white bg-gradient-to-r from-[#FF3366] to-[#FF6B35] hover:scale-105 transform transition-all duration-300 shadow-lg hover:shadow-[#FF6B35]/50"
                    >
                      View Full →
                    </Link>
                  </div>
                  <div className="w-full rounded-xl overflow-hidden glow-orange">
                    <VideoPlayer
                      playbackId={latestStream.livepeer_stream_id}
                      title={latestStream.title}
                      type="live"
                      showControls={true}
                      autoPlay={false}
                    />
                  </div>
                </div>
              ) : (
                <div className="mb-8 rounded-xl border border-white/10 bg-gradient-to-br from-black to-[#0a0a0a] p-8 shadow-2xl">
                  <div className="mb-4">
                    <h2 className="text-3xl font-black text-white flex items-center gap-3">
                      <span className="text-4xl">📡</span>
                      Live Stream
                    </h2>
                    <p className="mt-2 text-base text-white/60">
                      No live streams at the moment
                    </p>
                  </div>
                  <div className="flex aspect-video w-full items-center justify-center rounded-xl bg-gradient-to-br from-[#0a0a0a] to-black border border-white/10">
                    <div className="text-center">
                      <div className="relative inline-block">
                        <div className="absolute inset-0 bg-gradient-to-r from-[#FF6B35] to-[#00D9FF] opacity-20 blur-xl rounded-full"></div>
                        <svg
                          className="relative mx-auto h-16 w-16 text-white/20"
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
                      </div>
                      <p className="mt-6 text-base font-medium text-white/40">
                        Check back soon for live content
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Videos Grid Section */}
              <div>
                <div className="mb-8 flex items-center justify-between">
                  <div>
                    <h2 className="text-4xl font-black gradient-text flex items-center gap-3">
                      <span className="text-5xl">🎬</span>
                      Videos
                    </h2>
                    <p className="mt-2 text-lg text-white/60">
                      Browse our collection of on-demand basketball content
                    </p>
                  </div>
                  {videos.length > 0 && (
                    <Link
                      href="/videos"
                      className="px-6 py-3 rounded-lg font-bold text-white bg-gradient-to-r from-[#00D9FF] to-[#B24BF3] hover:scale-105 transform transition-all duration-300 shadow-lg hover:shadow-[#00D9FF]/50"
                    >
                      View All →
                    </Link>
                  )}
                </div>

                {videos.length === 0 ? (
                  <div className="rounded-xl border border-white/10 bg-gradient-to-br from-black to-[#0a0a0a] p-16 text-center shadow-2xl">
                    <div className="relative inline-block">
                      <div className="absolute inset-0 bg-gradient-to-r from-[#FF6B35] to-[#00D9FF] opacity-20 blur-xl rounded-full"></div>
                      <svg
                        className="relative mx-auto h-20 w-20 text-white/20"
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
                    </div>
                    <h3 className="mt-6 text-2xl font-black text-white">
                      No videos yet
                    </h3>
                    <p className="mt-3 text-base text-white/60">
                      Check back soon for new content!
          </p>
        </div>
                ) : (
                  <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:gap-10">
                    {videos.map((video, index) => (
                      <div
                        key={video.id}
                        className="animate-fade-in-up"
                        style={{
                          animationDelay: `${index * 50}ms`,
                          opacity: 0,
                        }}
                      >
                        <VideoCard
                          id={video.id}
                          title={video.title}
                          description={video.description}
                          thumbnailUrl={video.thumbnail_url}
                          priceUsd={video.price_usd}
                          isFree={video.is_free}
                          status={video.status}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Shop (1/4 width) */}
            <div className="lg:col-span-1">
              <div className="sticky top-28 rounded-xl border border-[#B24BF3]/30 bg-gradient-to-br from-black to-[#0a0a0a] p-6 shadow-2xl shadow-[#B24BF3]/20">
                <h2 className="text-2xl font-black gradient-text flex items-center gap-2">
                  <span className="text-3xl">🛍️</span>
                  Shop
                </h2>
                <div className="mt-8 flex flex-col items-center justify-center py-12 text-center">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-[#B24BF3] to-[#FF3366] opacity-20 blur-xl rounded-full"></div>
                    <svg
                      className="relative h-20 w-20 text-white/20"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                      />
                    </svg>
                  </div>
                  <h3 className="mt-6 text-xl font-black text-white">
                    Coming Soon
                  </h3>
                  <p className="mt-3 text-sm text-white/60 leading-relaxed">
                    Exclusive basketball gear, merch, and collectibles. Stay tuned for the drop! 🏀
                  </p>
                  <div className="mt-6 w-full">
                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full w-3/4 bg-gradient-to-r from-[#FF6B35] to-[#FF3366] rounded-full animate-pulse"></div>
                    </div>
                    <p className="mt-2 text-xs text-white/40">75% Complete</p>
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
