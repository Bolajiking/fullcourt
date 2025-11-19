import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';

async function inspectVideos() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: videos, error, count } = await supabase
    .from('videos')
    .select('*', { count: 'exact' });

  if (error) {
    console.error('Error fetching videos:', error);
    return;
  }

  console.log(`Total Videos in DB: ${count}`);
  console.log('-----------------------------------');
  videos?.forEach((video) => {
    console.log(`ID: ${video.id}`);
    console.log(`Title: ${video.title}`);
    console.log(`Livepeer Asset ID: ${video.livepeer_asset_id}`);
    console.log(`Status: ${video.status}`);
    console.log(`Created At: ${video.created_at}`);
    console.log('-----------------------------------');
  });
}

inspectVideos();

