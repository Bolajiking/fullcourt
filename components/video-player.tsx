'use client';

import { 
  Root, 
  Video, 
  Container, 
  Controls, 
  PlayPauseTrigger, 
  Volume, 
  Time, 
  FullscreenTrigger,
  Seek,
  Range,
  Track,
  Thumb,
  RateSelect,
  LoadingIndicator,
  ErrorIndicator,
  PlayingIndicator,
  LiveIndicator,
} from '@livepeer/react/player';
import type { Src } from '@livepeer/react';
import { useState, useEffect, useRef } from 'react';

const buildHlsSrc = (url: string): Src =>
  ({
    src: url,
    type: 'application/vnd.apple.mpegurl',
  } as unknown as Src);

interface VideoPlayerProps {
  playbackId: string;
  title?: string;
  poster?: string;
  autoPlay?: boolean;
  showControls?: boolean;
  type?: 'vod' | 'live';
  initialSrc?: Src[] | null;
}

/**
 * Video Player Component using Livepeer
 * Based on official Livepeer documentation: https://docs.livepeer.org/sdks/react/Player
 * 
 * The player uses getSrc to create proper source configuration from a playback ID.
 */
export default function VideoPlayer({
  playbackId,
  title = 'Video',
  poster,
  autoPlay = false,
  showControls = true,
  type = 'vod',
  initialSrc = null,
}: VideoPlayerProps) {
  const [source, setSource] = useState<Src[] | null>(initialSrc);
  const [isLoadingSource, setIsLoadingSource] = useState(!initialSrc);
  const [error, setError] = useState<string | null>(null);
  const mountTimeRef = useRef(Date.now());
  
  // Fetch the playback URL from our API (which uses the Livepeer SDK)
  useEffect(() => {
    if (!playbackId) {
      setIsLoadingSource(false);
      return;
    }

    if (initialSrc) {
      setSource(initialSrc);
      setIsLoadingSource(false);
      return;
    }
    
    const trimmedPlaybackId = playbackId.trim();
    console.log('[Video Player] Fetching playback URL for:', trimmedPlaybackId);
    
    const fallbackCdnUrl = `https://livepeercdn.studio/hls/${trimmedPlaybackId}/index.m3u8`;

    fetch(`/api/videos/playback-url?playbackId=${encodeURIComponent(trimmedPlaybackId)}`)
      .then(async (response) => {
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to fetch playback URL: ${response.status}`);
        }
        
        return response.json();
      })
      .then((data) => {
        if (data.playbackUrl) {
          console.log('[Video Player] Fetched playback URL:', data.playbackUrl.substring(0, 100) + '...');
          setSource([buildHlsSrc(data.playbackUrl)]);
          setError(null);
        } else {
          console.warn('[Video Player] No playback URL in response, falling back to CDN');
          setSource([buildHlsSrc(fallbackCdnUrl)]);
          setError(null);
        }
      })
      .catch((err) => {
        console.error('[Video Player] Error fetching playback URL, using fallback CDN URL:', err);
        setSource([buildHlsSrc(fallbackCdnUrl)]);
        setError(null);
      })
      .finally(() => {
        setIsLoadingSource(false);
      });
  }, [playbackId, initialSrc]);
  
  // Create source array for the player
  const src: Src[] | null = source;
  
  // Show loading state while fetching URL
  if (isLoadingSource) {
    return (
      <div className="flex aspect-video w-full items-center justify-center rounded-xl bg-gradient-to-br from-black to-[#0a0a0a] border border-white/10">
        <div className="text-center">
          <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-[#FF6B35] border-t-transparent"></div>
          <p className="text-sm font-medium text-white/80">Loading video...</p>
        </div>
      </div>
    );
  }
  
  // Show error if no playback ID or failed to fetch URL
  if (!playbackId || !src || error) {
    return (
      <div className="flex aspect-video w-full items-center justify-center rounded-xl bg-gradient-to-br from-black to-[#0a0a0a] border border-white/10">
        <div className="text-center p-8">
          <div className="mb-4">
            <svg className="mx-auto h-16 w-16 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-white/70 text-lg font-medium mb-2">
            Video unavailable
          </p>
          <p className="text-white/50 text-sm">
            Unable to load video playback
          </p>
          {error && (
            <p className="mt-4 text-xs text-red-400">
              {error}
            </p>
          )}
          {playbackId && (
            <p className="mt-4 text-xs text-white/40">
              Playback ID: {playbackId}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Render the Livepeer player with proper error handling
  return (
    <div className="w-full">
      <Root
        src={src}
        autoPlay={autoPlay}
        onError={(error) => {
          // Livepeer player fires benign errors while warming up live streams
          // These should be completely ignored to avoid alarming users
          
          if (!error) return; // null/undefined
          
          // Ignore ALL errors in the first 10 seconds (warmup period for live streams)
          const timeSinceMount = Date.now() - mountTimeRef.current;
          if (type === 'live' && timeSinceMount < 10000) {
            // Live streams need time to connect - ignore all errors during warmup
            return;
          }
          
          const errorType = (error as any)?.type;
          const errorMessage = (error as any)?.message || '';
          const errorCode = (error as any)?.code;
          
          // Check if error is essentially empty (common during stream initialization)
          const errorJson = JSON.stringify(error);
          const isEmptyError = errorJson === '{}' || errorJson === '[]';
          
          // Check for the specific "canPlay timeout" error
          const isCanPlayTimeout = errorMessage.toLowerCase().includes('canplay') || 
                                   errorMessage.toLowerCase().includes('timeout');
          
          // Ignore all benign error types:
          if (
            errorType === 'timeout' ||           // Timeout type
            errorCode === 'timeout' ||           // Timeout code
            isCanPlayTimeout ||                  // canPlay timeout message
            (!errorType && !errorMessage) ||     // No type or message
            isEmptyError                         // Completely empty object
          ) {
            // Silently ignore - these are expected during live stream warmup
            return;
          }
          
          // Only log and show UI errors for actual playback failures
          console.error('[Video Player] Playback error:', {
            type: errorType,
            message: errorMessage,
            code: errorCode,
            error
          });
          setError(errorMessage || 'Playback error occurred');
        }}
      >
        <Container className="aspect-video w-full rounded-xl overflow-hidden bg-black border border-white/10">
          <Video
            title={title}
            poster={poster}
            className="h-full w-full object-contain"
            onLoadStart={() => console.log('[Video Player] Video load started')}
            onCanPlay={() => console.log('[Video Player] Video can play')}
            onPlay={() => console.log('[Video Player] Video playing')}
            onError={(e) => console.error('[Video Player] Video element error:', e)}
          />

          {/* Loading Indicator */}
          <LoadingIndicator className="absolute inset-0 bg-black/50 backdrop-blur data-[visible=true]:animate-in data-[visible=false]:animate-out data-[visible=false]:fade-out-0 data-[visible=true]:fade-in-0">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="w-12 h-12 border-4 border-[#FF6B35] border-t-transparent rounded-full animate-spin"></div>
            </div>
          </LoadingIndicator>

          {/* Error: Stream Offline (for live streams) */}
          <ErrorIndicator
            matcher="offline"
            className="absolute inset-0 bg-black/90 backdrop-blur flex items-center justify-center data-[visible=true]:animate-in data-[visible=false]:animate-out data-[visible=false]:fade-out-0 data-[visible=true]:fade-in-0"
          >
            <div className="text-center p-8">
              <div className="text-2xl font-black gradient-text mb-3">
                Stream is offline
              </div>
              <p className="text-white/60 text-sm">
                Playback will start automatically once the stream begins
              </p>
              <div className="w-12 h-12 mx-auto mt-6 border-4 border-[#00D9FF] border-t-transparent rounded-full animate-spin"></div>
            </div>
          </ErrorIndicator>

          {/* Error: Access Control */}
          <ErrorIndicator
            matcher="access-control"
            className="absolute inset-0 bg-black/90 backdrop-blur flex items-center justify-center data-[visible=true]:animate-in data-[visible=false]:animate-out data-[visible=false]:fade-out-0 data-[visible=true]:fade-in-0"
          >
            <div className="text-center p-8">
              <div className="text-2xl font-black gradient-text mb-3">
                Stream is private
              </div>
              <p className="text-white/60 text-sm">
                You don't have permission to view this content
              </p>
            </div>
          </ErrorIndicator>

          {/* Error: All other errors */}
          <ErrorIndicator
            matcher="all"
            className="absolute inset-0 bg-black/90 backdrop-blur flex items-center justify-center data-[visible=true]:animate-in data-[visible=false]:animate-out data-[visible=false]:fade-out-0 data-[visible=true]:fade-in-0"
          >
            <div className="text-center p-8">
              <div className="text-2xl font-black text-white mb-3">
                Playback Error
              </div>
              <p className="text-white/60 text-sm">
                Unable to load video. Please try again later.
              </p>
            </div>
          </ErrorIndicator>

          {/* Video Controls */}
          {showControls && (
            <Controls className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/90 via-black/50 to-transparent px-4 py-3 data-[visible=true]:animate-in data-[visible=false]:animate-out data-[visible=false]:fade-out-0 data-[visible=true]:fade-in-0">
              {/* Progress Bar */}
              <div className="mb-3">
                <Seek className="group relative flex cursor-pointer items-center select-none touch-none w-full h-5">
                  <Track className="bg-white/20 relative grow rounded-full h-[3px] group-hover:h-[4px] transition-all">
                    <Range className="absolute bg-gradient-to-r from-[#FF6B35] to-[#FF3366] rounded-full h-full" />
                  </Track>
                  <Thumb className="block group-hover:scale-125 w-3 h-3 bg-white transition-transform rounded-full shadow-lg" />
                </Seek>
              </div>
              
              {/* Control Buttons */}
              <div className="flex items-center gap-3">
                {/* Play/Pause */}
                <PlayPauseTrigger className="w-8 h-8 hover:scale-110 transition-transform flex-shrink-0 text-white">
                  <PlayingIndicator asChild matcher={false}>
                    <svg className="w-full h-full" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </PlayingIndicator>
                  <PlayingIndicator asChild matcher={true}>
                    <svg className="w-full h-full" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                    </svg>
                  </PlayingIndicator>
                </PlayPauseTrigger>

                {/* Live Indicator (for live streams) */}
                <LiveIndicator className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-sm font-bold text-white">LIVE</span>
                </LiveIndicator>

                {/* Time (for VOD) */}
                <LiveIndicator matcher={false} className="flex items-center">
                  <Time className="text-sm font-mono text-white tabular-nums" />
                </LiveIndicator>

                {/* Volume */}
                <Volume className="flex items-center gap-2 max-w-[100px] flex-1">
                  <button className="w-6 h-6 text-white hover:scale-110 transition-transform flex-shrink-0">
                    <svg className="w-full h-full" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
                    </svg>
                  </button>
                  <Track className="bg-white/20 relative grow rounded-full h-[3px]">
                    <Range className="absolute bg-white rounded-full h-full" />
                  </Track>
                  <Thumb className="block w-3 h-3 bg-white rounded-full transition-transform hover:scale-125" />
                </Volume>

                <div className="flex-1" />

                {/* Playback Rate (VOD only) */}
                {type === 'vod' && (
                  <LiveIndicator matcher={false}>
                    <div className="rounded-md bg-white/10 hover:bg-white/20 px-2 py-1 text-xs text-white transition-colors font-medium">
                      <RateSelect>
                        1x
                      </RateSelect>
                    </div>
                  </LiveIndicator>
                )}

                {/* Fullscreen */}
                <FullscreenTrigger className="w-8 h-8 hover:scale-110 transition-transform flex-shrink-0 text-white">
                  <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                </FullscreenTrigger>
              </div>
            </Controls>
          )}
        </Container>
      </Root>
    </div>
  );
}

// Also export as named export for backward compatibility
export { VideoPlayer };

