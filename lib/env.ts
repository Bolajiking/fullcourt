/**
 * Environment variable validation and access
 * This file ensures all required environment variables are present
 */

// Client-side environment variables (must be prefixed with NEXT_PUBLIC_)
export const env = {
  // Livepeer
  livepeerApiKey: process.env.NEXT_PUBLIC_LIVEPEER_API_KEY || '',
  
  // Privy
  privyAppId: process.env.NEXT_PUBLIC_PRIVY_APP_ID || '',
  
  // Supabase
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  
  // Blockchain
  chainId: process.env.NEXT_PUBLIC_CHAIN_ID ? parseInt(process.env.NEXT_PUBLIC_CHAIN_ID) : 8453,
  chainName: process.env.NEXT_PUBLIC_CHAIN_NAME || 'base',
  rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || 'https://mainnet.base.org',
  
  // App
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
} as const;

// Server-side only environment variables
export const serverEnv = {
  // Livepeer (server-side API key for admin operations)
  // Use LIVEPEER_API_KEY if set, otherwise fallback to NEXT_PUBLIC_LIVEPEER_API_KEY
  livepeerApiKey: process.env.LIVEPEER_API_KEY || process.env.NEXT_PUBLIC_LIVEPEER_API_KEY || '',
  
  // Privy
  privyAppSecret: process.env.PRIVY_APP_SECRET || '',
  
  // Supabase
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  
  // Admin
  adminUserIds: process.env.ADMIN_USER_IDS?.split(',').map(id => id.trim()) || [],
  
  // Node
  nodeEnv: process.env.NODE_ENV || 'development',
} as const;

/**
 * Validate that all required environment variables are set
 * Call this in development to catch missing variables early
 */
export function validateEnv() {
  const required = {
    client: [
      { key: 'NEXT_PUBLIC_LIVEPEER_API_KEY', value: env.livepeerApiKey },
      { key: 'NEXT_PUBLIC_PRIVY_APP_ID', value: env.privyAppId },
      { key: 'NEXT_PUBLIC_SUPABASE_URL', value: env.supabaseUrl },
      { key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', value: env.supabaseAnonKey },
    ],
    server: [
      { key: 'LIVEPEER_API_KEY', value: serverEnv.livepeerApiKey },
      { key: 'PRIVY_APP_SECRET', value: serverEnv.privyAppSecret },
      { key: 'SUPABASE_SERVICE_ROLE_KEY', value: serverEnv.supabaseServiceRoleKey },
    ],
  };

  const missing: string[] = [];

  required.client.forEach(({ key, value }) => {
    if (!value || value.includes('your_') || value.includes('_here')) {
      missing.push(key);
    }
  });

  required.server.forEach(({ key, value }) => {
    if (!value || value.includes('your_') || value.includes('_here')) {
      missing.push(key);
    }
  });

  if (missing.length > 0 && serverEnv.nodeEnv === 'development') {
    console.warn('⚠️  Missing or placeholder environment variables:', missing.join(', '));
    console.warn('Please update your .env.local file with actual values.');
  }

  return missing.length === 0;
}

