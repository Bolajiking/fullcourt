'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth/use-auth';
import type { LivepeerVideoRecord } from '@/lib/video/livepeer-data';

export function ContentManager() {
  const { user } = useAuth();
  const [videos, setVideos] = useState<LivepeerVideoRecord[]>([]);
  const [recordings, setRecordings] = useState<LivepeerVideoRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'videos' | 'recordings'>('videos');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingVideo, setEditingVideo] = useState<LivepeerVideoRecord | null>(null);

  // Fetch content
  const fetchContent = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/content');
      if (res.ok) {
        const data = await res.json();
        setVideos(data.videos || []);
        setRecordings(data.recordings || []);
      }
    } catch (error) {
      console.error('Error fetching content:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  // Actions
  const handleDeleteVideo = async (id: string) => {
    if (!confirm('Are you sure? This will delete the video from Livepeer and Supabase.')) return;
    
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/videos/${id}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': user?.id || '',
        },
      });
      
      if (!res.ok) throw new Error('Failed to delete');
      
      await fetchContent(); // Refresh
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Failed to delete video');
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteAsset = async (id: string) => {
    if (!confirm('Are you sure? This will delete the recording from Livepeer permanently.')) return;
    
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/assets/${id}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': user?.id || '',
        },
      });
      
      if (!res.ok) throw new Error('Failed to delete');
      
      await fetchContent(); // Refresh
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Failed to delete recording');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingVideo || !editingVideo.supabaseId) return;

    const formData = new FormData(e.currentTarget);
    const data = {
      title: formData.get('title'),
      description: formData.get('description'),
      price_usd: parseFloat(formData.get('price') as string) || 0,
      is_free: formData.get('is_free') === 'on',
    };

    try {
      const res = await fetch(`/api/admin/videos/${editingVideo.supabaseId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || '',
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error('Failed to update');

      setEditingVideo(null);
      await fetchContent();
    } catch (error) {
      console.error('Update failed:', error);
      alert('Failed to update video');
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-zinc-500">Loading content...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Manage Content</h2>
        <div className="flex gap-2 bg-zinc-900 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('videos')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'videos'
                ? 'bg-white text-black'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Uploaded Videos ({videos.length})
          </button>
          <button
            onClick={() => setActiveTab('recordings')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'recordings'
                ? 'bg-white text-black'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Recorded Sessions ({recordings.length})
          </button>
        </div>
      </div>

      <div className="grid gap-4">
        {(activeTab === 'videos' ? videos : recordings).map((item) => (
          <div
            key={item.slug}
            className="flex items-center gap-4 p-4 bg-zinc-900/50 border border-white/5 rounded-xl overflow-hidden"
          >
            {/* Thumbnail */}
            <div className="w-32 aspect-video bg-black rounded-lg overflow-hidden flex-shrink-0 relative">
              {item.thumbnailUrl ? (
                <img
                  src={item.thumbnailUrl}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-700">
                  No thumb
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-white truncate">{item.title}</h3>
              <p className="text-sm text-zinc-400 truncate">
                {item.description || 'No description'}
              </p>
              <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500">
                <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                <span>•</span>
                <span>{item.isFree ? 'Free' : `$${item.priceUsd}`}</span>
                <span>•</span>
                <span className="font-mono">{item.livepeerAssetId.slice(0, 8)}...</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {activeTab === 'videos' && (
                <button
                  onClick={() => setEditingVideo(item)}
                  className="px-3 py-1.5 text-sm font-medium text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
                >
                  Edit
                </button>
              )}
              <button
                onClick={() =>
                  activeTab === 'videos'
                    ? handleDeleteVideo(item.supabaseId!)
                    : handleDeleteAsset(item.livepeerAssetId)
                }
                disabled={deletingId === (item.supabaseId || item.livepeerAssetId)}
                className="px-3 py-1.5 text-sm font-medium text-red-400 hover:text-red-300 bg-red-900/20 hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-50"
              >
                {deletingId === (item.supabaseId || item.livepeerAssetId)
                  ? 'Deleting...'
                  : 'Delete'}
              </button>
            </div>
          </div>
        ))}

        {(activeTab === 'videos' ? videos : recordings).length === 0 && (
          <div className="p-12 text-center text-zinc-500 bg-zinc-900/30 rounded-xl border border-white/5">
            No content found.
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-zinc-900 border border-white/10 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-4">Edit Video</h3>
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Title</label>
                <input
                  name="title"
                  defaultValue={editingVideo.title}
                  required
                  className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-lg text-white focus:border-white/30 focus:outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Description</label>
                <textarea
                  name="description"
                  defaultValue={editingVideo.description}
                  rows={3}
                  className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-lg text-white focus:border-white/30 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">Price (USD)</label>
                  <input
                    name="price"
                    type="number"
                    step="0.01"
                    defaultValue={editingVideo.priceUsd}
                    className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-lg text-white focus:border-white/30 focus:outline-none"
                  />
                </div>
                <div className="flex items-center pt-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      name="is_free"
                      type="checkbox"
                      defaultChecked={editingVideo.isFree}
                      className="w-4 h-4 rounded border-zinc-700 bg-black text-white"
                    />
                    <span className="text-sm text-zinc-300">Is Free?</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEditingVideo(null)}
                  className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium bg-white text-black hover:bg-zinc-200 rounded-lg"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

