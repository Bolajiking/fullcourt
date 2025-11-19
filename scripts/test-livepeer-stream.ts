
import { config } from 'dotenv';
import path from 'path';

// Load env vars
config({ path: path.resolve(process.cwd(), '.env.local') });

async function testLivepeerStreamCreation() {
  const LIVEPEER_API_URL = 'https://livepeer.studio/api';
  // Access directly from process.env since we can't import lib/env easily in standalone script
  const apiKey = process.env.LIVEPEER_API_KEY || process.env.NEXT_PUBLIC_LIVEPEER_API_KEY;

  if (!apiKey) {
    console.error('No Livepeer API Key found in .env.local');
    return;
  }

  console.log('Testing Livepeer Stream Creation...');
  console.log('Using API Key:', apiKey.substring(0, 4) + '...');

  try {
    // 1. Create Stream
    console.log('\n1. Creating Stream...');
    const createRes = await fetch(`${LIVEPEER_API_URL}/stream`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: 'Test Stream Script', record: true })
    });

    if (!createRes.ok) {
        console.error('Create failed:', createRes.status, await createRes.text());
        return;
    }

    const createdStream = await createRes.json();
    console.log('Created Stream:', JSON.stringify(createdStream, null, 2));
    
    // Check key properties
    if (!createdStream.streamKey) console.error('CRITICAL: No streamKey in create response!');
    else console.log('SUCCESS: streamKey found in CREATE response.');

    const streamId = createdStream.id;

    // 2. Get Stream
    console.log(`\n2. Getting Stream ${streamId}...`);
    const getRes = await fetch(`${LIVEPEER_API_URL}/stream/${streamId}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
        }
    });

    if (!getRes.ok) {
        console.error('Get failed:', getRes.status, await getRes.text());
    } else {
        const getStream = await getRes.json();
        console.log('Get Stream Response:', JSON.stringify(getStream, null, 2));
        
        if (!getStream.streamKey) console.error('CRITICAL: No streamKey in GET response!');
        else console.log('SUCCESS: streamKey found in GET response.');
    }

    // 3. Cleanup
    console.log(`\n3. Deleting Stream ${streamId}...`);
    await fetch(`${LIVEPEER_API_URL}/stream/${streamId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
        }
    });
    console.log('Cleanup done.');

  } catch (e) {
    console.error('Test failed with exception:', e);
  }
}

testLivepeerStreamCreation();
