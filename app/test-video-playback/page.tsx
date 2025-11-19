import VideoPlayer from '@/components/video-player';

export default function TestVideoPlayback() {
  // Test with known working playback IDs
  const testVideos = [
    {
      id: '1',
      title: 'Video 1 - c266jdxxnqeipqpx',
      playbackId: 'c266jdxxnqeipqpx',
    },
    {
      id: '2',
      title: 'Video 2 - d144dlmdum874znq',
      playbackId: 'd144dlmdum874znq',
    },
    {
      id: '3',
      title: 'Video 3 - e3b0yjfl1gp7f8lj',
      playbackId: 'e3b0yjfl1gp7f8lj',
    },
  ];

  return (
    <div className="min-h-screen bg-black p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">Video Playback Test</h1>
        <p className="text-white/60 mb-8">Testing Livepeer video playback with known playback IDs</p>
        
        <div className="space-y-12">
          {testVideos.map((video) => (
            <div key={video.id} className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">{video.title}</h2>
                <a
                  href={`/api/videos/playback-url?playbackId=${video.playbackId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-[#FF6B35] hover:text-[#FF8C5A] transition-colors"
                >
                  Test API →
                </a>
              </div>
              
              <div className="max-w-4xl">
                <VideoPlayer
                  playbackId={video.playbackId}
                  title={video.title}
                  showControls={true}
                  autoPlay={false}
                />
              </div>
              
              <div className="text-xs text-white/40 font-mono">
                Playback ID: {video.playbackId}
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-12 p-6 bg-white/5 rounded-lg border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-2">✅ Success Criteria:</h3>
          <ul className="text-white/70 space-y-2 text-sm">
            <li>• Videos should load within 2-3 seconds</li>
            <li>• Video controls (play, pause, seek, fullscreen) should work</li>
            <li>• Console should show: <code className="text-[#FF6B35]">[Video Player] Fetched playback URL</code></li>
            <li>• No errors in console</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

