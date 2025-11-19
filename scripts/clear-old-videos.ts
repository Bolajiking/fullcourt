import { getSupabaseAdmin } from '@/lib/supabase/server';

/**
 * Clear all videos from the database
 * This is useful when switching Livepeer API keys
 */
async function clearOldVideos() {
  console.log('🧹 Clearing old videos from database...\n');
  
  const supabase = getSupabaseAdmin();
  
  // First, get all videos
  const { data: videos, error: fetchError } = await supabase
    .from('videos')
    .select('*');
  
  if (fetchError) {
    console.error('❌ Error fetching videos:', fetchError);
    process.exit(1);
  }
  
  console.log(`Found ${videos?.length || 0} videos in database:`);
  videos?.forEach((video) => {
    console.log(`  - ${video.title} (Asset: ${video.livepeer_asset_id})`);
  });
  
  console.log('\n🗑️  Deleting all videos...');
  
  // Delete all videos
  const { error: deleteError } = await supabase
    .from('videos')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all (using a condition that matches everything)
  
  if (deleteError) {
    console.error('❌ Error deleting videos:', deleteError);
    process.exit(1);
  }
  
  console.log('✅ All videos deleted successfully!');
  console.log('\n📝 Next steps:');
  console.log('  1. Your new Livepeer API key is active');
  console.log('  2. Go to http://localhost:3000/admin');
  console.log('  3. Upload new videos - they will use your new API key');
  console.log('\n🎉 Database is clean and ready for fresh uploads!');
}

clearOldVideos().catch((error) => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});

