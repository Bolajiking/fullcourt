'use client';

import { Navigation } from '@/components/navigation';
import { Footer } from '@/components/footer';
import { useAuth } from '@/lib/auth/use-auth';
import { useEffect, useState } from 'react';
import { getSupabase } from '@/lib/supabase/client';

interface UserProfile {
  id: string;
  privy_user_id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export default function ProfilePage() {
  const { isReady, isAuthenticated, user, userId } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isReady && isAuthenticated && userId) {
      loadProfile();
    }
  }, [isReady, isAuthenticated, userId]);

  async function loadProfile() {
    if (!userId) return;

    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('privy_user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 is "not found" - that's okay, we'll create one
        console.error('Error loading profile:', error);
      }

      if (data) {
        setProfile(data);
        setDisplayName(data.display_name || '');
        setEmail(data.email || '');
      } else {
        // Create profile if it doesn't exist
        await createProfile();
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  }

  async function createProfile() {
    if (!userId || !user) return;

    try {
      const emailAddress = user.email?.address || user.google?.email || null;
      
      // Use API route to create profile (bypasses RLS with service role key)
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          privy_user_id: userId,
          email: emailAddress,
          display_name: user.google?.name || user.twitter?.name || null,
          avatar_url: user.google?.picture || user.twitter?.profilePictureUrl || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error creating profile:', {
          status: response.status,
          error: errorData.error,
        });
        alert(`Failed to create profile: ${errorData.error || 'Unknown error'}`);
        return;
      }

      const { profile: newProfile } = await response.json();
      
      if (newProfile) {
        setProfile(newProfile);
        setDisplayName(newProfile.display_name || '');
        setEmail(newProfile.email || '');
      }
    } catch (error) {
      console.error('Error creating profile (catch):', {
        message: error instanceof Error ? error.message : String(error),
        error,
      });
      alert(`Failed to create profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async function saveProfile() {
    if (!userId) return;

    setSaving(true);
    try {
      if (profile) {
        // Update existing profile via API route
        const response = await fetch('/api/profile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            privy_user_id: userId,
            email: email || null,
            display_name: displayName || null,
            avatar_url: profile.avatar_url,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('Error updating profile:', {
            status: response.status,
            error: errorData.error,
          });
          alert(`Failed to update profile: ${errorData.error || 'Unknown error'}`);
          return;
        }

        const { profile: updatedProfile } = await response.json();
        
        if (updatedProfile) {
          setProfile(updatedProfile);
          alert('Profile updated successfully!');
        }
      } else {
        // Create new profile
        await createProfile();
      }
    } catch (error) {
      console.error('Error saving profile:', {
        message: error instanceof Error ? error.message : String(error),
        error,
      });
      alert('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  // During SSR, render a consistent loading state
  if (!mounted) {
    return (
      <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
        <Navigation />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-zinc-600 dark:text-zinc-400">Loading...</div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!isReady) {
    return (
      <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
        <Navigation />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-zinc-600 dark:text-zinc-400">Loading...</div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
        <Navigation />
        <main className="flex-1">
          <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
            <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-black">
              <h2 className="text-2xl font-bold text-black dark:text-white">
                Please sign in
              </h2>
              <p className="mt-2 text-zinc-600 dark:text-zinc-400">
                You need to be signed in to view your profile.
              </p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
      <Navigation />
      
      <main className="flex-1">
        <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
          <h1 className="mb-8 text-3xl font-bold tracking-tight text-black dark:text-white">
            Profile
          </h1>

          {loading ? (
            <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-black">
              <div className="text-zinc-600 dark:text-zinc-400">Loading profile...</div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* User Info Card */}
              <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-black">
                <h2 className="mb-4 text-xl font-semibold text-black dark:text-white">
                  Account Information
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      User ID
                    </label>
                    <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                      {userId}
                    </div>
                  </div>

                  {user?.wallet?.address && (
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        Wallet Address
                      </label>
                      <div className="mt-1 font-mono text-sm text-zinc-600 dark:text-zinc-400">
                        {user.wallet.address}
                      </div>
                    </div>
                  )}

                  <div>
                    <label htmlFor="display-name" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      Display Name
                    </label>
                    <input
                      type="text"
                      id="display-name"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-black shadow-sm focus:border-black focus:outline-none focus:ring-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:focus:border-white dark:focus:ring-white"
                      placeholder="Enter your display name"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-black shadow-sm focus:border-black focus:outline-none focus:ring-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:focus:border-white dark:focus:ring-white"
                      placeholder="Enter your email"
                    />
                  </div>

                  <div className="pt-4">
                    <button
                      onClick={saveProfile}
                      disabled={saving}
                      className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-white dark:text-black dark:hover:bg-zinc-200"
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Profile Stats */}
              {profile && (
                <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-black">
                  <h2 className="mb-4 text-xl font-semibold text-black dark:text-white">
                    Profile Details
                  </h2>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-zinc-600 dark:text-zinc-400">Member since</span>
                      <span className="text-black dark:text-white">
                        {new Date(profile.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {profile.updated_at && (
                      <div className="flex justify-between">
                        <span className="text-zinc-600 dark:text-zinc-400">Last updated</span>
                        <span className="text-black dark:text-white">
                          {new Date(profile.updated_at).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

