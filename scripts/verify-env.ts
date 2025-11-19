/**
 * Script to verify environment variables are set correctly
 * Run with: npx tsx scripts/verify-env.ts
 */

import { env, serverEnv, validateEnv } from '../lib/env';

console.log('🔍 Verifying environment variables...\n');

// Check client-side variables
console.log('Client-side variables:');
console.log('  NEXT_PUBLIC_SUPABASE_URL:', env.supabaseUrl ? '✅ Set' : '❌ Missing');
console.log('  NEXT_PUBLIC_SUPABASE_ANON_KEY:', env.supabaseAnonKey ? '✅ Set' : '❌ Missing');
console.log('  NEXT_PUBLIC_LIVEPEER_API_KEY:', env.livepeerApiKey ? '✅ Set' : '❌ Missing');
console.log('  NEXT_PUBLIC_PRIVY_APP_ID:', env.privyAppId ? '✅ Set' : '❌ Missing');

console.log('\nServer-side variables:');
console.log('  SUPABASE_SERVICE_ROLE_KEY:', serverEnv.supabaseServiceRoleKey ? '✅ Set' : '❌ Missing');
console.log('  LIVEPEER_API_KEY:', serverEnv.livepeerApiKey ? '✅ Set' : '❌ Missing');
console.log('  PRIVY_APP_SECRET:', serverEnv.privyAppSecret ? '✅ Set' : '❌ Missing');

console.log('\n');

// Validate all required variables
const isValid = validateEnv();
if (isValid) {
  console.log('✅ All required environment variables are set!');
} else {
  console.log('⚠️  Some environment variables are missing or contain placeholders.');
  console.log('Please check your .env.local file.');
  process.exit(1);
}

// Check for placeholder values
const hasPlaceholders = 
  env.supabaseUrl.includes('your_') || 
  env.supabaseAnonKey.includes('your_') ||
  serverEnv.supabaseServiceRoleKey.includes('your_');

if (hasPlaceholders) {
  console.log('⚠️  Warning: Some values contain placeholder text (your_).');
  console.log('Please replace with actual values from your Supabase dashboard.');
  process.exit(1);
}

console.log('\n✅ Environment validation complete!');

