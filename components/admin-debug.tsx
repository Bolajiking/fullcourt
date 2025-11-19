'use client';

import { useAuth } from '@/lib/auth/use-auth';
import { useAdmin } from '@/lib/auth/use-admin';
import { useEffect, useState } from 'react';

/**
 * Debug component to check admin status
 * Remove this in production
 */
export function AdminDebug() {
  const { isReady, isAuthenticated, userId, user } = useAuth();
  const { isAdmin, loading } = useAdmin();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Only render on client after mount to prevent hydration mismatch
  if (!mounted || !isReady || !isAuthenticated) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 rounded-lg border-2 border-red-500 bg-white p-4 text-xs shadow-lg dark:bg-black">
      <div className="font-bold text-red-600">Admin Debug Info</div>
      <div className="mt-2 space-y-1">
        <div>
          <strong>User ID:</strong> {userId || 'Not set'}
        </div>
        <div>
          <strong>Is Admin:</strong> {loading ? 'Loading...' : isAdmin ? '✅ Yes' : '❌ No'}
        </div>
        <div>
          <strong>Admin Loading:</strong> {loading ? 'Yes' : 'No'}
        </div>
        <div>
          <strong>User Email:</strong> {user?.email?.address || 'N/A'}
        </div>
        <div>
          <strong>Expected Admin ID:</strong> cmi4ea4zw00nxl80ciu9rkaru
        </div>
        <div>
          <strong>Match:</strong>{' '}
          {userId === 'cmi4ea4zw00nxl80ciu9rkaru' ? '✅' : '❌'}
        </div>
      </div>
    </div>
  );
}

