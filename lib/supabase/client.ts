import { createClient } from '@supabase/supabase-js';
import { env } from '@/lib/env';

/**
 * Supabase client for client-side operations
 * Uses the anon key which respects Row Level Security policies
 */
export function getSupabase() {
  if (!env.supabaseUrl || !env.supabaseAnonKey || 
      env.supabaseUrl.includes('your_') || env.supabaseAnonKey.includes('your_')) {
    throw new Error(
      'Supabase credentials not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local'
    );
  }

  return createClient(env.supabaseUrl, env.supabaseAnonKey);
}

// Export a lazy-initialized client for convenience
export const supabase = new Proxy({} as ReturnType<typeof getSupabase>, {
  get(target, prop) {
    const client = getSupabase();
    return (client as any)[prop];
  },
});

