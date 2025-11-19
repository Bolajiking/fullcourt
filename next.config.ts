import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lp-assets.livepeer.studio',
        pathname: '/api/asset/**',
      },
      {
        protocol: 'https',
        hostname: 'livepeercdn.studio',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'vod-cdn.lp-playback.studio',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/**',
      },
    ],
    // Allow base64 data URLs for thumbnails
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  // Prevent bundling of server-only packages that cause build issues
  serverExternalPackages: ['pino', 'pino-pretty', 'thread-stream', 'pino-file', '@reown'],
};

export default nextConfig;
