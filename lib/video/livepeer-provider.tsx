'use client';

import { env } from '@/lib/env';

interface LivepeerProviderProps {
  children: React.ReactNode;
}

/**
 * Livepeer Video Provider
 * Note: In @livepeer/react v4.3.6, the Player component works without a provider wrapper
 * The getSrc helper and player components handle their own configuration
 * The API key is used by getSrc internally when needed
 */
export function LivepeerProvider({ children }: LivepeerProviderProps) {
  if (!env.livepeerApiKey) {
    console.warn('Livepeer API key not configured. Video features will not work.');
  }

  // Just return children - Player component and getSrc handle their own setup
  // The API key from env is used by getSrc when creating playback sources
  return <>{children}</>;
}

