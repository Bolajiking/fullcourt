import { Livepeer } from 'livepeer';

async function testLivepeerSDK() {
  console.log('Testing Livepeer SDK...\n');
  
  const apiKey = process.env.LIVEPEER_API_KEY || process.env.NEXT_PUBLIC_LIVEPEER_API_KEY;
  if (!apiKey) {
    console.error('No Livepeer API key found');
    process.exit(1);
  }
  
  const livepeer = new Livepeer({ apiKey });
  
  console.log('Livepeer client created');
  console.log('Available properties:', Object.keys(livepeer));
  console.log('');
  
  // Check if playback exists
  if (livepeer.playback) {
    console.log('✅ livepeer.playback exists');
    console.log('playback methods:', Object.keys(livepeer.playback));
    console.log('');
    
    // Test playback.get()
    const testPlaybackId = 'c266jdxxnqeipqpx';
    console.log(`Testing playback.get("${testPlaybackId}")...`);
    
    try {
      const result = await livepeer.playback.get(testPlaybackId);
      console.log('✅ playback.get() succeeded!');
      console.log('Result keys:', Object.keys(result));
      console.log('Has playbackInfo:', !!result.playbackInfo);
      
      if (result.playbackInfo) {
        console.log('playbackInfo keys:', Object.keys(result.playbackInfo));
        console.log('Has meta:', !!result.playbackInfo.meta);
        
        if (result.playbackInfo.meta?.source) {
          console.log('Sources found:', result.playbackInfo.meta.source.length);
          console.log('\nAll sources:');
          result.playbackInfo.meta.source.forEach((source: any, index: number) => {
            console.log(`\nSource ${index + 1}:`, JSON.stringify(source, null, 2));
          });
          
          // Find HLS source
          const hlsSource = result.playbackInfo.meta.source.find((s: any) =>
            s.type === 'html5/application/vnd.apple.mpegurl' ||
            s.type?.includes('mpegurl') ||
            s.type?.includes('m3u8') ||
            s.url?.includes('.m3u8')
          );
          
          if (hlsSource) {
            console.log('\n✅ HLS Source found:', hlsSource.url);
          } else {
            console.log('\n❌ No HLS source found');
          }
        }
      }
    } catch (error: any) {
      console.error('❌ playback.get() failed:', error.message);
      console.error('Error details:', {
        status: error.status,
        statusCode: error.statusCode,
        body: error.body,
      });
    }
  } else {
    console.log('❌ livepeer.playback does not exist');
  }
}

testLivepeerSDK().catch(console.error);

