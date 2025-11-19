import { createClient } from '@supabase/supabase-js';
import { serverEnv } from '@/lib/env';

/**
 * Supabase client for server-side operations
 * Uses the service role key which bypasses Row Level Security
 * Only use this in API routes and server components where admin access is needed
 */
export function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = serverEnv.supabaseServiceRoleKey;

  if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('your_') || supabaseKey.includes('your_')) {
    throw new Error(
      'Supabase credentials not configured. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local'
    );
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// Export a lazy-initialized client for convenience
// This will throw an error if credentials aren't set, but only when actually used
export const supabaseAdmin = new Proxy({} as ReturnType<typeof getSupabaseAdmin>, {
  get(target, prop) {
    const client = getSupabaseAdmin();
    return (client as any)[prop];
  },
});

