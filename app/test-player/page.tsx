'use client';

import { VideoPlayer } from '@/components/video-player';
import Link from 'next/link';

export default function TestPlayerPage() {
  // Test with the playback ID we know exists
  const testPlaybackId = 'c266jdxxnqeipqpx';

  return (
    <div className="min-h-screen bg-black p-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="text-white/70 hover:text-white mb-6 inline-block">
          ← Back
        </Link>
        
        <h1 className="text-3xl font-bold text-white mb-6">
          Video Player Test
        </h1>
        
        <div className="bg-white/5 rounded-xl p-6 mb-6">
          <h2 className="text-white/80 mb-4">Test Playback ID: {testPlaybackId}</h2>
          <VideoPlayer
            playbackId={testPlaybackId}
            title="Test Video"
            showControls={true}
          />
        </div>
        
        <div className="text-white/60 text-sm space-y-2">
          <p>If you see a video player above with video controls, the player is working!</p>
          <p>If you see "Video is processing", the video might still be encoding on Livepeer.</p>
          <p>Check the browser console (F12) for detailed logs.</p>
        </div>
      </div>
    </div>
  );
}

