
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import path from 'path';

// Load env vars
config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifySchema() {
  console.log('Verifying database schema...');
  
  // 1. Check if column exists by trying to select it
  try {
      const { data, error } = await supabase
        .from('streams')
        .select('admin_user_id')
        .limit(1);
        
      if (error) {
          console.error('Error selecting admin_user_id:', error.message);
          console.log('DETAILS:', JSON.stringify(error, null, 2));
          
          if (error.message.includes('does not exist')) {
             console.log('\n--- CONCLUSION: The migration 003_add_admin_user_id_to_streams.sql WAS NOT RUN. ---');
             console.log('Please run the SQL migration in your Supabase Dashboard SQL Editor.');
          }
      } else {
          console.log('Successfully selected admin_user_id. Column exists.');
      }
  } catch (e) {
      console.error('Exception checking column:', e);
  }
}

verifySchema();
