import Link from 'next/link';
import Image from 'next/image';

interface VideoCardProps {
  id: string;
  href?: string;
  title: string;
  description?: string | null;
  thumbnailUrl?: string | null;
  priceUsd?: number;
  isFree?: boolean;
  status?: string;
}

export function VideoCard({
  id,
  href,
  title,
  description,
  thumbnailUrl,
  priceUsd = 0,
  isFree = true,
  status,
}: VideoCardProps) {
  // Don't show videos that aren't ready
  if (status !== 'ready') {
    return null;
  }

  return (
    <Link href={href ?? `/videos/${id}`} className="group block">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-black to-[#0a0a0a] border border-white/10 shadow-2xl hover:shadow-[#FF6B35]/50 transition-all duration-700 hover:scale-110 hover:border-[#FF6B35]/70 hover:z-50 hover:-translate-y-2">
        {/* Animated gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#FF6B35]/0 via-[#FF3366]/0 to-[#00D9FF]/0 group-hover:from-[#FF6B35]/20 group-hover:via-[#FF3366]/10 group-hover:to-[#00D9FF]/20 transition-all duration-700 rounded-xl z-10 pointer-events-none"></div>
        
        <div className="relative aspect-video w-full bg-gradient-to-br from-[#0a0a0a] to-black overflow-hidden group-hover:aspect-[16/12] transition-all duration-700">
          {thumbnailUrl ? (
            thumbnailUrl.startsWith('data:') ? (
              // Use regular img tag for base64 data URLs
              <img
                src={thumbnailUrl}
                alt={title}
                className="absolute inset-0 w-full h-full object-cover transition-all duration-700 group-hover:scale-115 group-hover:brightness-90"
              />
            ) : (
              // Use Next.js Image for remote URLs
              <Image
                src={thumbnailUrl}
                alt={title}
                fill
                className="object-cover transition-all duration-700 group-hover:scale-115 group-hover:brightness-90"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                priority={false}
              />
            )
          ) : (
            <div className="flex h-full items-center justify-center relative">
              <div className="absolute inset-0 bg-gradient-to-br from-[#FF6B35]/5 to-[#00D9FF]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
              <svg
                className="relative h-16 w-16 text-white/10 group-hover:text-white/30 transition-all duration-700 group-hover:scale-110"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </div>
          )}
          {/* Dark overlay that appears on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-700"></div>
          
          {/* Play button overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-all duration-500">
            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-[#FF6B35] to-[#FF3366] opacity-0 group-hover:opacity-100 transform scale-0 group-hover:scale-100 transition-all duration-500 flex items-center justify-center shadow-2xl shadow-[#FF6B35]/70 ring-4 ring-white/20">
              <svg className="w-10 h-10 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
          </div>
          
          {!isFree && (
            <div className="absolute right-3 top-3 rounded-lg bg-gradient-to-r from-[#FF6B35] to-[#FF3366] px-3 py-1.5 text-xs font-black text-white shadow-lg shadow-[#FF6B35]/50 z-20 group-hover:scale-110 transition-transform duration-300">
              ${priceUsd.toFixed(2)}
            </div>
          )}
        </div>
        
        {/* Info panel that slides up on hover - Netflix style */}
        <div className="p-5 relative z-20 bg-gradient-to-t from-black via-black/95 to-black/90">
          <h3 className="line-clamp-2 text-lg font-black text-white group-hover:gradient-text transition-all duration-500 mb-2">
            {title}
          </h3>
          
          {/* Hidden info that appears on hover */}
          <div className="max-h-0 opacity-0 group-hover:max-h-40 group-hover:opacity-100 overflow-hidden transition-all duration-700 space-y-3">
            {description && (
              <p className="text-sm text-white/70 line-clamp-3">
                {description}
              </p>
            )}
            
            {/* Action buttons row */}
            <div className="flex items-center gap-3 pt-2">
              <button className="flex-1 py-2 px-4 bg-gradient-to-r from-[#FF6B35] to-[#FF3366] rounded-lg font-bold text-white text-sm hover:scale-105 transition-transform duration-300 shadow-lg shadow-[#FF6B35]/50 flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
                Play
              </button>
              <button className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors duration-300 border border-white/20">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
            
            {/* Metadata */}
            <div className="flex items-center gap-4 text-xs text-white/50">
              <span className="flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"/>
                </svg>
                Video
              </span>
              {isFree && (
                <span className="px-2 py-0.5 bg-[#00FF88]/20 text-[#00FF88] rounded font-bold">
                  FREE
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

