import { Navigation } from '@/components/navigation';
import { Footer } from '@/components/footer';
import { VideoCard } from '@/components/video-card';
import { getLivepeerVideos } from '@/lib/video/livepeer-data';

export default async function VideosPage() {
  const videos = await getLivepeerVideos(48);

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
          <div className="mb-12">
            <h1 className="text-5xl font-black gradient-text flex items-center gap-4">
              <span className="text-6xl">🎬</span>
              All Videos
            </h1>
            <p className="mt-4 text-lg text-white/60">
              Browse our complete collection of basketball content
            </p>
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
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-10">
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
        </div>
      </main>

      <Footer />
    </div>
  );
}

