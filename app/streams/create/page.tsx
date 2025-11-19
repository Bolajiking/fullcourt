'use client';

import { Navigation } from '@/components/navigation';
import { Footer } from '@/components/footer';
import { useAuth } from '@/lib/auth/use-auth';
import { useAdmin } from '@/lib/auth/use-admin';
import { StreamCreateForm } from '@/components/admin/stream-create-form';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function CreateStreamPage() {
  const { isReady, isAuthenticated } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const router = useRouter();
  const [latestStream, setLatestStream] = useState<string | null>(null);

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
                You need to be signed in to create live streams.
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
                Only admin creators can create live streams.
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
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
          <h1 className="mb-8 text-3xl font-bold tracking-tight text-black dark:text-white">
            Create Live Stream
          </h1>

          <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-black">
            <h2 className="mb-4 text-xl font-semibold text-black dark:text-white">
              Stream Setup
            </h2>
            <StreamCreateForm
              onSuccess={(stream) => {
                setLatestStream(stream.streamId);
              }}
            />
            {latestStream && (
              <div className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
                Latest stream:{' '}
                <button
                  onClick={() => router.push(`/streams/${latestStream}`)}
                  className="font-medium text-black underline-offset-2 hover:underline dark:text-white"
                >
                  View stream →
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

