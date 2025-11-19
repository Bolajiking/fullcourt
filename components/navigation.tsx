'use client';

import { useAuth } from '@/lib/auth/use-auth';
import { useAdmin } from '@/lib/auth/use-admin';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export function Navigation() {
  const { isReady, isAuthenticated, user, login, logout, userId } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Debug logging
  useEffect(() => {
    if (mounted && isReady && isAuthenticated) {
      console.log('[Navigation] Auth state:', {
        userId,
        isAdmin,
        adminLoading,
        userEmail: user?.email?.address,
      });
    }
  }, [mounted, isReady, isAuthenticated, userId, isAdmin, adminLoading, user]);

  return (
    <nav className="border-b border-[#FF6B35]/20 bg-black/95 backdrop-blur-xl sticky top-0 z-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link 
              href="/" 
              className="text-2xl font-black gradient-text hover:scale-105 transform transition-transform duration-300 flex items-center gap-2"
            >
              <span className="text-3xl">🏀</span>
              Full Court
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex md:items-center md:space-x-2">
            <Link
              href="/videos"
              className="relative px-4 py-2 text-sm font-bold text-white/80 hover:text-white transition-all duration-300 group"
            >
              <span className="relative z-10">Videos</span>
              <span className="absolute inset-0 bg-gradient-to-r from-[#FF6B35] to-[#FF3366] rounded-lg opacity-0 group-hover:opacity-20 transition-opacity duration-300"></span>
            </Link>
            <Link
              href="/streams"
              className="relative px-4 py-2 text-sm font-bold text-white/80 hover:text-white transition-all duration-300 group"
            >
              <span className="relative z-10 flex items-center gap-1">
                <span className="w-2 h-2 bg-[#00FF88] rounded-full animate-pulse"></span>
                Live Streams
              </span>
              <span className="absolute inset-0 bg-gradient-to-r from-[#00D9FF] to-[#B24BF3] rounded-lg opacity-0 group-hover:opacity-20 transition-opacity duration-300"></span>
            </Link>
            <Link
              href="/products"
              className="relative px-4 py-2 text-sm font-bold text-white/80 hover:text-white transition-all duration-300 group"
            >
              <span className="relative z-10">Shop</span>
              <span className="absolute inset-0 bg-gradient-to-r from-[#B24BF3] to-[#FF3366] rounded-lg opacity-0 group-hover:opacity-20 transition-opacity duration-300"></span>
            </Link>
            {mounted && isAuthenticated && !adminLoading && (
              <>
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="relative px-4 py-2 text-sm font-bold text-white/80 hover:text-white transition-all duration-300 group"
                  >
                    <span className="relative z-10">⚡ Admin</span>
                    <span className="absolute inset-0 bg-gradient-to-r from-[#FF8C42] to-[#FF6B35] rounded-lg opacity-0 group-hover:opacity-20 transition-opacity duration-300"></span>
                  </Link>
                )}
                <Link
                  href="/profile"
                  className="relative px-4 py-2 text-sm font-bold text-white/80 hover:text-white transition-all duration-300 group"
                >
                  <span className="relative z-10">Profile</span>
                  <span className="absolute inset-0 bg-gradient-to-r from-[#00D9FF] to-[#00FF88] rounded-lg opacity-0 group-hover:opacity-20 transition-opacity duration-300"></span>
                </Link>
              </>
            )}
          </div>

          {/* Auth Section */}
          <div className="flex items-center space-x-4">
            {!mounted || !isReady ? (
              <div className="h-10 w-24 animate-pulse rounded-lg bg-gradient-to-r from-[#FF6B35]/20 to-[#FF3366]/20" />
            ) : isAuthenticated ? (
              <div className="flex items-center space-x-3">
                <Link
                  href="/profile"
                  className="hidden lg:block text-sm font-medium text-white/60 hover:text-white transition-colors duration-300"
                >
                  {user?.email?.address || user?.wallet?.address?.slice(0, 8) + '...' || 'Profile'}
                </Link>
                <button
                  onClick={logout}
                  className="relative px-5 py-2.5 rounded-lg font-bold text-white bg-gradient-to-r from-[#FF3366] to-[#FF6B35] hover:scale-105 transform transition-all duration-300 shadow-lg hover:shadow-[#FF6B35]/50"
                >
                  <span className="relative z-10">Logout</span>
                </button>
              </div>
            ) : (
              <button
                onClick={login}
                className="relative px-6 py-3 rounded-lg font-black text-black bg-gradient-to-r from-[#FF8C42] to-[#FF6B35] hover:scale-105 transform transition-all duration-300 shadow-xl hover:shadow-[#FF6B35]/50 glow-orange"
              >
                <span className="relative z-10">Connect Wallet</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

