import { serverEnv } from '@/lib/env';

/**
 * Check if a user ID is an admin (server-side)
 */
export function isAdmin(userId: string | null | undefined): boolean {
  if (!userId) return false;
  return serverEnv.adminUserIds.includes(userId);
}

/**
 * Get admin user IDs (server-side only)
 */
export function getAdminUserIds(): string[] {
  return serverEnv.adminUserIds;
}

