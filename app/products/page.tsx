import { Navigation } from '@/components/navigation';
import { Footer } from '@/components/footer';

export default function ProductsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
      <Navigation />
      
      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-900">
              <svg
                className="h-12 w-12 text-zinc-400"
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
            <h1 className="mt-6 text-4xl font-bold tracking-tight text-black dark:text-white">
              E-commerce Coming Soon
            </h1>
            <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
              We're working on bringing you a full e-commerce experience.
              Check back soon for physical products and merchandise!
            </p>
            <div className="mt-8">
              <a
                href="/"
                className="inline-flex items-center rounded-md bg-black px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
              >
                Back to Home
              </a>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

