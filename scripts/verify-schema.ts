/**
 * Verify that all database tables and schema are set up correctly
 * Run with: npx tsx scripts/verify-schema.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

const expectedTables = [
  'videos',
  'streams',
  'products',
  'orders',
  'user_content_access',
  'user_profiles',
];

async function verifySchema() {
  console.log('🔍 Verifying database schema...\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials!');
    process.exit(1);
  }

  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    console.log('Checking tables...\n');
    const results: { table: string; exists: boolean; count: number; error?: string }[] = [];

    for (const table of expectedTables) {
      try {
        const { data, error, count } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });

        if (error) {
          results.push({ table, exists: false, count: 0, error: error.message });
        } else {
          results.push({ table, exists: true, count: count || 0 });
        }
      } catch (err) {
        results.push({
          table,
          exists: false,
          count: 0,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    // Display results
    let allExist = true;
    for (const result of results) {
      if (result.exists) {
        console.log(`✅ ${result.table.padEnd(25)} - exists (${result.count} records)`);
      } else {
        console.log(`❌ ${result.table.padEnd(25)} - missing`);
        if (result.error) {
          console.log(`   Error: ${result.error}`);
        }
        allExist = false;
      }
    }

    console.log('\n');

    if (allExist) {
      console.log('🎉 All tables exist! Database schema is set up correctly.');
      console.log('\nNext steps:');
      console.log('  - Your Supabase setup is complete');
      console.log('  - You can now start building your application');
      console.log('  - Test the connection with: npx tsx scripts/test-supabase.ts');
    } else {
      console.log('⚠️  Some tables are missing. Please run the migrations:');
      console.log('  1. supabase/migrations/001_initial_schema.sql');
      console.log('  2. supabase/migrations/002_row_level_security.sql');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Connection failed:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}

verifySchema();

