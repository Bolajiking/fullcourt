import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-[#FF6B35]/20 bg-gradient-to-b from-black to-[#0a0a0a] relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#FF6B35] rounded-full filter blur-[128px] animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#00D9FF] rounded-full filter blur-[128px] animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>
      
      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-4">
          <div className="md:col-span-2">
            <h3 className="text-2xl font-black gradient-text flex items-center gap-2">
              <span className="text-3xl">🏀</span>
              Full Court
            </h3>
            <p className="mt-4 text-base text-white/60 leading-relaxed max-w-md">
              The ultimate basketball content platform. Stream live games, watch highlights, and engage with the community that lives and breathes the game.
            </p>
            <div className="mt-6 flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-gradient-to-r from-[#FF6B35] to-[#FF3366] flex items-center justify-center hover:scale-110 transform transition-all duration-300 glow-orange">
                <span className="text-white font-bold">𝕏</span>
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-gradient-to-r from-[#00D9FF] to-[#B24BF3] flex items-center justify-center hover:scale-110 transform transition-all duration-300 glow-blue">
                <span className="text-white font-bold">IG</span>
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-gradient-to-r from-[#B24BF3] to-[#FF3366] flex items-center justify-center hover:scale-110 transform transition-all duration-300 glow-purple">
                <span className="text-white font-bold">YT</span>
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-black text-white uppercase tracking-wider mb-4">Content</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/videos" className="text-white/60 hover:text-[#FF6B35] transition-colors duration-300 flex items-center gap-2 group">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B35] opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  Videos
                </Link>
              </li>
              <li>
                <Link href="/streams" className="text-white/60 hover:text-[#00D9FF] transition-colors duration-300 flex items-center gap-2 group">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00D9FF] opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  Live Streams
                </Link>
              </li>
              <li>
                <Link href="/products" className="text-white/60 hover:text-[#B24BF3] transition-colors duration-300 flex items-center gap-2 group">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#B24BF3] opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  Shop
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-sm font-black text-white uppercase tracking-wider mb-4">Account</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/profile" className="text-white/60 hover:text-[#00FF88] transition-colors duration-300 flex items-center gap-2 group">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00FF88] opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  Profile
                </Link>
              </li>
              <li>
                <Link href="/admin" className="text-white/60 hover:text-[#FF8C42] transition-colors duration-300 flex items-center gap-2 group">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FF8C42] opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  Creator Dashboard
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-white/10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-white/40">
              © {new Date().getFullYear()} Full Court. Bringing the game to life.
            </p>
            <div className="flex gap-6 text-xs text-white/40">
              <a href="#" className="hover:text-white/60 transition-colors">Privacy</a>
              <a href="#" className="hover:text-white/60 transition-colors">Terms</a>
              <a href="#" className="hover:text-white/60 transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

