import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

import { Livepeer } from 'livepeer';

const ASSET_IDS = [
  '8aeef463-c47d-44b6-b87e-0fa1c7fad45a',
  '33a745a5-2a0a-4ea9-8a41-5839c1bbeb38'
];

async function checkAssets() {
  const apiKey = process.env.LIVEPEER_API_KEY || process.env.NEXT_PUBLIC_LIVEPEER_API_KEY;
  if (!apiKey) {
    console.error('Missing LIVEPEER_API_KEY');
    return;
  }

  const livepeer = new Livepeer({ apiKey });

  for (const assetId of ASSET_IDS) {
    try {
      console.log(`Checking asset: ${assetId}...`);
      const result = await livepeer.asset.get(assetId);
      const asset = result.asset || result.data?.asset || result.data; // Handle potential response variants
      
      if (asset) {
        console.log(`✅ Asset Found: ${asset.name}`);
        console.log(`   Status: ${asset.status?.phase}`);
      } else {
        console.log(`❌ Asset returned empty/null`);
      }
    } catch (error: any) {
      console.log(`❌ Asset Not Found / Error: ${error.message}`);
    }
    console.log('---');
  }
}

checkAssets();

