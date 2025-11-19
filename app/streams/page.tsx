import { Navigation } from '@/components/navigation';
import { Footer } from '@/components/footer';
import { getSupabase } from '@/lib/supabase/client';
import Link from 'next/link';

async function getStreams() {
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from('streams')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching streams:', error);
    return [];
  }

  return data || [];
}

export default async function StreamsPage() {
  const streams = await getStreams();

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

          {streams.length === 0 ? (
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
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {streams.map((stream) => (
                <Link
                  key={stream.id}
                  href={`/streams/${stream.id}`}
                  className="group relative overflow-hidden rounded-lg bg-white shadow-sm transition-shadow hover:shadow-md dark:bg-black"
                >
                  <div className="relative aspect-video w-full bg-zinc-100 dark:bg-zinc-900">
                    {stream.is_live ? (
                      <div className="absolute left-2 top-2 flex items-center gap-2 rounded-md bg-red-600 px-2 py-1">
                        <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
                        <span className="text-xs font-medium text-white">LIVE</span>
                      </div>
                    ) : null}
                    {!stream.is_free && (
                      <div className="absolute right-2 top-2 rounded-md bg-black/80 px-2 py-1 text-xs font-medium text-white">
                        ${stream.price_usd.toFixed(2)}
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="line-clamp-2 text-lg font-semibold text-black group-hover:text-zinc-600 dark:text-white dark:group-hover:text-zinc-300">
                      {stream.title}
                    </h3>
                    {stream.description && (
                      <p className="mt-2 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
                        {stream.description}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

