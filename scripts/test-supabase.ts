/**
 * Direct test of Supabase connection
 * Run with: npx tsx scripts/test-supabase.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

async function testSupabase() {
  console.log('🔍 Testing Supabase connection...\n');

  // Check environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log('Environment variables:');
  console.log('  NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? `✅ Set (${supabaseUrl.length} chars, starts with: ${supabaseUrl.substring(0, 20)}...)` : '❌ Missing');
  console.log('  NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? `✅ Set (${supabaseAnonKey.length} chars)` : '❌ Missing');
  console.log('  SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? `✅ Set (${supabaseServiceKey.length} chars)` : '❌ Missing');
  console.log('');

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
    console.error('❌ Missing required environment variables!');
    console.error('Please check your .env.local file.');
    process.exit(1);
  }

  // Validate format
  if (!supabaseUrl.startsWith('https://') || !supabaseUrl.includes('.supabase.co')) {
    console.warn('⚠️  Warning: NEXT_PUBLIC_SUPABASE_URL does not look like a valid Supabase URL');
    console.warn('   Expected format: https://xxxxx.supabase.co');
    console.warn('   Continuing with connection test anyway...\n');
  }

  try {
    // Test with service role key (admin access)
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    console.log('Testing database connection...');
    
    // Try to query the videos table
    const { data, error, count } = await supabase
      .from('videos')
      .select('*', { count: 'exact', head: true });

    if (error) {
      if (error.message.includes('relation "videos" does not exist')) {
        console.log('⚠️  Connection successful, but tables not found.');
        console.log('💡 You need to run the database migrations in your Supabase dashboard.');
        console.log('   See: supabase/migrations/001_initial_schema.sql');
        console.log('   See: supabase/migrations/002_row_level_security.sql');
        process.exit(0);
      } else {
        console.error('❌ Database error:', error.message);
        console.error('   Code:', error.code);
        process.exit(1);
      }
    } else {
      console.log('✅ Database connection successful!');
      console.log(`   Videos table exists with ${count || 0} records`);
      console.log('\n🎉 Supabase setup is complete!');
    }
  } catch (error) {
    console.error('❌ Connection failed:', error instanceof Error ? error.message : 'Unknown error');
    if (error instanceof Error && error.message.includes('Invalid API key')) {
      console.error('💡 Check that your SUPABASE_SERVICE_ROLE_KEY is correct.');
    }
    process.exit(1);
  }
}

testSupabase();

