/**
 * Verification script to check if the streams table has the required columns:
 * - admin_user_id (from migration 003)
 * - playback_id (from migration 005)
 * - record_enabled (from migration 006)
 */

// Load environment variables from .env.local
import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';

async function verifyStreamColumns() {
  console.log('\n🔍 Verifying streams table columns...\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Environment variables not loaded');
    console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'SET' : 'MISSING');
    console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? 'SET' : 'MISSING');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  try {
    // Test direct query to streams table to check which columns exist
    console.log('🔍 Testing query to streams table...');
    const { data, error } = await supabase
      .from('streams')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Error querying streams table:', error);
      return;
    }

    if (!data || data.length === 0) {
      console.log('⚠️  No streams found in table (table is empty)');
      console.log('   Creating a test query to check columns...');
      
      // Try to select specific columns to see which ones exist
      const requiredColumns = ['admin_user_id', 'playback_id', 'record_enabled'];
      const missingColumns: string[] = [];
      
      for (const col of requiredColumns) {
        const { error: colError } = await supabase
          .from('streams')
          .select(col)
          .limit(1);
        
        if (colError && colError.message.includes('column')) {
          missingColumns.push(col);
        }
      }
      
      if (missingColumns.length === 0) {
        console.log('\n✅ All required columns exist in the streams table!\n');
      } else {
        printMissingColumnsHelp(missingColumns);
      }
    } else {
      // We have data, check the columns
      const sampleRow = data[0];
      const existingColumns = Object.keys(sampleRow);
      const requiredColumns = ['admin_user_id', 'playback_id', 'record_enabled'];
      const missingColumns = requiredColumns.filter(col => !(col in sampleRow));

      console.log('✅ Successfully queried streams table');
      console.log('📊 Existing columns:', existingColumns.join(', '));
      console.log('📋 Required columns:', requiredColumns.join(', '));

      if (missingColumns.length === 0) {
        console.log('\n✅ All required columns exist in the streams table!\n');
        console.log('Sample row:');
        console.log(JSON.stringify(sampleRow, null, 2));
      } else {
        printMissingColumnsHelp(missingColumns);
      }
    }

  } catch (err) {
    console.error('❌ Verification failed:', err);
  }
}

function printMissingColumnsHelp(missingColumns: string[]) {
  console.log('\n⚠️  Missing columns:', missingColumns.join(', '));
  console.log('\n📝 To fix this, run the following migrations in Supabase Dashboard SQL Editor:');
  
  if (missingColumns.includes('admin_user_id')) {
    console.log('\n1. Migration 003 (admin_user_id):');
    console.log('   File: supabase/migrations/003_add_admin_user_id_to_streams.sql');
  }
  
  if (missingColumns.includes('playback_id')) {
    console.log('\n2. Migration 005 (playback_id):');
    console.log('   File: supabase/migrations/005_add_playback_id_to_streams.sql');
  }
  
  if (missingColumns.includes('record_enabled')) {
    console.log('\n3. Migration 006 (record_enabled):');
    console.log('   File: supabase/migrations/006_add_record_flag.sql');
  }
  
  console.log('\n📍 Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/sql/new');
  console.log('   Copy the SQL from each migration file and execute it.\n');
}

verifyStreamColumns();
