import { NextRequest, NextResponse } from 'next/server';
import { serverEnv } from '@/lib/env';

/**
 * GET /api/videos/check-livepeer?playbackId={playbackId}
 * Checks if a Livepeer video is actually accessible by trying multiple CDN URLs
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const playbackId = searchParams.get('playbackId');
    
    if (!playbackId) {
      return NextResponse.json({ error: 'playbackId is required' }, { status: 400 });
    }

    // Try multiple CDN URL formats
    const cdnUrls = [
      `https://livepeercdn.com/hls/${playbackId}/index.m3u8`,
      `https://cdn.livepeer.com/hls/${playbackId}/index.m3u8`,
      `https://vod-cdn.lp-playback.studio/hls/${playbackId}/index.m3u8`,
    ];

    const results = await Promise.all(
      cdnUrls.map(async (url) => {
        try {
          const response = await fetch(url, {
            method: 'HEAD', // Just check if it exists
            headers: {
              'User-Agent': 'Full-Court-Video-Platform/1.0',
            },
          });

          return {
            url,
            status: response.status,
            statusText: response.statusText,
            accessible: response.ok,
            contentType: response.headers.get('content-type'),
          };
        } catch (error: any) {
          return {
            url,
            status: 0,
            statusText: error.message || 'Network error',
            accessible: false,
            error: error.message,
          };
        }
      })
    );

    const accessibleUrls = results.filter((r) => r.accessible);

    return NextResponse.json({
      playbackId,
      results,
      accessibleCount: accessibleUrls.length,
      recommendation: accessibleUrls.length > 0
        ? `Use: ${accessibleUrls[0].url}`
        : 'Video may still be processing on Livepeer. Check your Livepeer dashboard.',
    });
  } catch (error) {
    console.error('[Check Livepeer] Error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

