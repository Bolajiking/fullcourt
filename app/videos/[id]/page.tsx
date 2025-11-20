import { Navigation } from '@/components/navigation';
import { Footer } from '@/components/footer';
import { VideoPlayer } from '@/components/video-player';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getLivepeerVideoBySlug } from '@/lib/video/livepeer-data';
import { getPlaybackSrc } from '@/lib/video/livepeer-utils';

// Force dynamic rendering for video data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface VideoPageProps {
  params: Promise<{ id: string }>;
}

export default async function VideoPage({ params }: VideoPageProps) {
  const { id } = await params;
  const video = await getLivepeerVideoBySlug(id);

  if (!video || video.status !== 'ready') {
    notFound();
  }

  const playbackSrc = video.playbackId
    ? await getPlaybackSrc(video.playbackId)
    : null;

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
              {video.playbackId ? (
                <VideoPlayer
                  playbackId={video.playbackId}
                  title={video.title}
                  poster={video.thumbnailUrl || undefined}
                  showControls={true}
                  initialSrc={playbackSrc}
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
                {video.isFree ? (
                  <span className="font-medium text-green-600 dark:text-green-400">
                    Free
                  </span>
                ) : (
                  <span className="font-semibold text-black dark:text-white">
                    ${video.priceUsd.toFixed(2)}
                  </span>
                )}
              </div>
              <div className="text-sm text-zinc-600 dark:text-zinc-400">
                {new Date(video.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

