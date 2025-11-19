import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';

async function checkThumbnails() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: videos, error } = await supabase
    .from('videos')
    .select('id, title, thumbnail_url');

  if (error) {
    console.error('Error fetching videos:', error);
    return;
  }

  console.log('Video Thumbnails:');
  console.log('-----------------------------------');
  videos?.forEach((video) => {
    console.log(`Title: ${video.title}`);
    console.log(`Thumbnail Type: ${video.thumbnail_url ? (video.thumbnail_url.startsWith('data:') ? 'Base64' : 'URL') : 'NULL'}`);
    if (video.thumbnail_url) {
      console.log(`Thumbnail Preview: ${video.thumbnail_url.substring(0, 100)}...`);
    }
    console.log('-----------------------------------');
  });
}

checkThumbnails();

