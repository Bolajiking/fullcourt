'use client';

import { Navigation } from '@/components/navigation';
import { Footer } from '@/components/footer';
import { useAuth } from '@/lib/auth/use-auth';
import { useAdmin } from '@/lib/auth/use-admin';
import { useEffect, useState } from 'react';
import { getSupabase } from '@/lib/supabase/client';
import { VideoUploadForm } from '@/components/admin/video-upload-form';
import { StreamCreateForm } from '@/components/admin/stream-create-form';
import { ProductCreateForm } from '@/components/admin/product-create-form';

interface Stats {
  videos: number;
  streams: number;
  products: number;
}

interface LatestData {
  videos: any[];
  streams: any[];
  products: any[];
}

export default function AdminPage() {
  const { isReady, isAuthenticated } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [stats, setStats] = useState<Stats>({ videos: 0, streams: 0, products: 0 });
  const [latest, setLatest] = useState<LatestData>({ videos: [], streams: [], products: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  async function fetchData() {
    setLoading(true);
    try {
      const supabase = getSupabase();

      const [videoCount, streamCount, productCount, videos, streams, products] = await Promise.all([
        supabase.from('videos').select('*', { count: 'exact', head: true }),
        supabase.from('streams').select('*', { count: 'exact', head: true }),
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('videos').select('*').order('created_at', { ascending: false }).limit(5),
        supabase.from('streams').select('*').order('created_at', { ascending: false }).limit(5),
        supabase.from('products').select('*').order('created_at', { ascending: false }).limit(5),
      ]);

      setStats({
        videos: videoCount.count || 0,
        streams: streamCount.count || 0,
        products: productCount.count || 0,
      });

      setLatest({
        videos: videos.data || [],
        streams: streams.data || [],
        products: products.data || [],
      });
    } catch (error) {
      console.error('Failed to load admin data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (!isReady || adminLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
        <Navigation />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-zinc-600 dark:text-zinc-400">Loading...</div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
        <Navigation />
        <main className="flex-1">
          <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
            <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-black">
              <h2 className="text-2xl font-bold text-black dark:text-white">
                Please sign in
              </h2>
              <p className="mt-2 text-zinc-600 dark:text-zinc-400">
                Creator tools are only available after signing in.
              </p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
        <Navigation />
        <main className="flex-1">
          <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
            <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-black">
              <h2 className="text-2xl font-bold text-black dark:text-white">
                Access Denied
              </h2>
              <p className="mt-2 text-zinc-600 dark:text-zinc-400">
                Only admin creators can access this page.
              </p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
      <Navigation />

      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-wide text-zinc-500">Creator Console</p>
              <h1 className="text-3xl font-bold tracking-tight text-black dark:text-white">
                Admin Dashboard
              </h1>
              <p className="mt-2 text-zinc-600 dark:text-zinc-400">
                Upload videos, start livestreams, and manage storefront items.
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { label: 'Videos', value: stats.videos },
              { label: 'Streams', value: stats.streams },
              { label: 'Products', value: stats.products },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-black">
                <p className="text-sm text-zinc-500">{stat.label}</p>
                <p className="mt-2 text-3xl font-bold text-black dark:text-white">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Creator tools */}
          <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-black">
              <h2 className="text-xl font-semibold text-black dark:text-white">Upload Video</h2>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                Upload on-demand content with pricing controls.
              </p>
              <div className="mt-4">
                <VideoUploadForm />
              </div>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-black">
              <h2 className="text-xl font-semibold text-black dark:text-white">Go Live</h2>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                Generate RTMP credentials and start streaming.
              </p>
              <div className="mt-4">
                <StreamCreateForm />
              </div>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-black">
              <h2 className="text-xl font-semibold text-black dark:text-white">Add Product</h2>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                Upload merch or physical products for your fans.
              </p>
              <div className="mt-4">
                <ProductCreateForm />
              </div>
            </div>
          </div>

          {/* Latest activity */}
          <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-3">
            {['videos', 'streams', 'products'].map((type) => (
              <div key={type} className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-black">
                <h3 className="text-lg font-semibold capitalize text-black dark:text-white">
                  Latest {type}
                </h3>
                {loading ? (
                  <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">Loading...</p>
                ) : latest[type as keyof LatestData].length === 0 ? (
                  <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">No entries yet.</p>
                ) : (
                  <ul className="mt-4 space-y-3">
                    {latest[type as keyof LatestData].map((item: any) => (
                      <li key={item.id} className="rounded-lg border border-zinc-200 p-3 text-sm dark:border-zinc-800">
                        <p className="font-medium text-black dark:text-white">{item.title || item.name}</p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          {new Date(item.created_at).toLocaleString()}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

