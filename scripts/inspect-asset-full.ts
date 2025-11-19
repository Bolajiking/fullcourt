import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

import { Livepeer } from 'livepeer';

async function inspectAsset() {
  const apiKey = process.env.LIVEPEER_API_KEY || process.env.NEXT_PUBLIC_LIVEPEER_API_KEY;
  if (!apiKey) {
    console.error('Missing LIVEPEER_API_KEY');
    return;
  }

  const livepeer = new Livepeer({ apiKey });
  const assetId = '8aeef463-c47d-44b6-b87e-0fa1c7fad45a'; // "new basketballer"

  try {
    const result = await livepeer.asset.get(assetId);
    const asset = result.asset || result.data?.asset || result.data;
    
    console.log('Full Asset Object:');
    console.log(JSON.stringify(asset, null, 2));
  } catch (error: any) {
    console.error('Error fetching asset:', error.message);
  }
}

inspectAsset();

