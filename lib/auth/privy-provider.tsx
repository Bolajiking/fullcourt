'use client';

import { PrivyProvider as PrivyProviderBase } from '@privy-io/react-auth';
import { env } from '@/lib/env';
import { useMemo } from 'react';

interface PrivyProviderProps {
  children: React.ReactNode;
}

/**
 * Privy Authentication Provider
 * Wraps the app with Privy authentication context
 * Supports Web3 wallet authentication (Base chain)
 */
export function PrivyProvider({ children }: PrivyProviderProps) {
  const privyConfig = useMemo(() => {
    if (!env.privyAppId) {
      return null;
    }

    return {
      // Login methods
      loginMethods: ['wallet', 'email', 'sms'] as ('wallet' | 'email' | 'sms')[],
      
      // Appearance
      appearance: {
        theme: 'light' as const,
        accentColor: '#000000' as `#${string}`,
        logo: '/next.svg',
      },
      
      // Supported chains (Base mainnet)
      defaultChain: {
        id: env.chainId,
        name: env.chainName,
        network: env.chainName,
        nativeCurrency: {
          name: 'Ether',
          symbol: 'ETH',
          decimals: 18,
        },
        rpcUrls: {
          default: {
            http: [env.rpcUrl],
          },
        },
      },
    };
  }, []);

  if (!env.privyAppId || !privyConfig) {
    console.warn('Privy App ID not configured. Authentication will not work.');
    return <>{children}</>;
  }

  return (
    <PrivyProviderBase
      appId={env.privyAppId}
      config={privyConfig}
    >
      {children}
    </PrivyProviderBase>
  );
}

