import { Livepeer } from 'livepeer';

/**
 * Verify which Livepeer account is currently active
 * and list all assets in that account
 */
async function verifyLivepeerAccount() {
  console.log('🔍 Verifying Livepeer Account...\n');
  
  const apiKey = process.env.LIVEPEER_API_KEY || process.env.NEXT_PUBLIC_LIVEPEER_API_KEY;
  
  if (!apiKey) {
    console.error('❌ No Livepeer API key found in environment variables');
    process.exit(1);
  }
  
  console.log('📋 Current API Key:', apiKey.substring(0, 20) + '...' + apiKey.slice(-4));
  console.log('');
  
  const livepeer = new Livepeer({ apiKey });
  
  try {
    // List all assets in this account
    console.log('📦 Fetching assets from Livepeer account...\n');
    
    const result = await livepeer.asset.getAll();
    
    // Handle different response structures
    const assets = result.data || result.assets || result || [];
    
    if (!Array.isArray(assets) || assets.length === 0) {
      console.log('✅ No assets found in this Livepeer account');
      console.log('   This is expected for a fresh/new account');
      console.log('');
      console.log('📝 Next steps:');
      console.log('   1. This appears to be your NEW Livepeer account (clean)');
      console.log('   2. Upload new videos at http://localhost:3000/admin');
      console.log('   3. They will be stored in THIS account');
      console.log('');
      return;
    }
    
    console.log(`Found ${assets.length} assets in this Livepeer account:\n`);
    
    assets.forEach((asset: any, index: number) => {
      console.log(`Asset ${index + 1}:`);
      console.log(`  Name: ${asset.name || 'Untitled'}`);
      console.log(`  ID: ${asset.id}`);
      console.log(`  Status: ${asset.status?.phase || asset.status || 'unknown'}`);
      console.log(`  Created: ${asset.createdAt ? new Date(asset.createdAt * 1000).toLocaleDateString() : 'unknown'}`);
      
      if (asset.playbackId) {
        console.log(`  Playback ID: ${asset.playbackId}`);
      }
      
      console.log('');
    });
    
    console.log('⚠️  WARNING: Assets found in this account!');
    console.log('');
    console.log('🤔 Is this the account you want to use?');
    console.log('');
    console.log('If these are OLD assets from a previous account:');
    console.log('  1. You may have the wrong API key configured');
    console.log('  2. Check your Livepeer dashboard to confirm which account this is');
    console.log('  3. Update .env.local with the correct NEW API key');
    console.log('  4. Restart the dev server');
    console.log('');
    console.log('If these are NEW assets you just uploaded:');
    console.log('  1. This is your current active account ✅');
    console.log('  2. The database was cleaned, so these won\'t show in the app yet');
    console.log('  3. Upload videos via the admin panel to sync them to the database');
    
  } catch (error: any) {
    console.error('❌ Error fetching assets:', error.message);
    console.error('');
    console.error('This could mean:');
    console.error('  1. Invalid API key');
    console.error('  2. Network connection issue');
    console.error('  3. Livepeer API is down');
    console.error('');
    console.error('Please verify your API key in .env.local');
    process.exit(1);
  }
}

verifyLivepeerAccount().catch((error) => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});

