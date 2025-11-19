'use client';

import { usePrivy } from '@privy-io/react-auth';

/**
 * Custom hook for authentication state and actions
 * Provides a simplified interface to Privy authentication
 */
export function useAuth() {
  const {
    ready,
    authenticated,
    user,
    login,
    logout,
    connectWallet,
    linkWallet,
  } = usePrivy();

  return {
    // State
    isReady: ready,
    isAuthenticated: authenticated,
    user,
    userId: user?.id,
    wallet: user?.wallet,
    
    // Actions
    login,
    logout,
    connectWallet,
    linkWallet,
  };
}

