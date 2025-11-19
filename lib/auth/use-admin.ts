'use client';

import { useAuth } from './use-auth';
import { useState, useEffect } from 'react';

/**
 * Custom hook to check if the current user is an admin
 */
export function useAdmin() {
  const { isReady, isAuthenticated, userId } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAdmin() {
      if (!isReady || !isAuthenticated || !userId) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        console.log('[useAdmin] Checking admin status for user:', userId);
        const response = await fetch(`/api/auth/check-admin?user_id=${encodeURIComponent(userId)}`);
        if (response.ok) {
          const { isAdmin: admin } = await response.json();
          console.log('[useAdmin] Admin check result:', admin);
          setIsAdmin(admin);
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.error('[useAdmin] Admin check failed:', response.status, errorData);
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('[useAdmin] Error checking admin status:', error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    }

    checkAdmin();
  }, [isReady, isAuthenticated, userId]);

  return {
    isAdmin,
    loading: loading || !isReady,
  };
}

