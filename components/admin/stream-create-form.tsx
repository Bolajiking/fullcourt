'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth/use-auth';
import { BroadcastPlayer } from './broadcast-player';

interface StreamCreateFormProps {
  onSuccess?: (stream: {
    streamId: string;
    rtmpUrl: string;
    streamKey: string;
    playbackId: string | null;
  }) => void;
}

export function StreamCreateForm({ onSuccess }: StreamCreateFormProps) {
  const { userId } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '0',
    isFree: true,
    recordEnabled: true,
  });
  const [loading, setLoading] = useState(false);
  const [streamData, setStreamData] = useState<{
    streamId: string;
    rtmpUrl: string;
    streamKey: string;
    playbackId: string | null;
    title?: string;
  } | null>(null);

  async function createStream() {
    if (!formData.title.trim()) {
      alert('Please enter a stream title');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/streams/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(userId ? { 'x-user-id': userId } : {}),
        },
        body: JSON.stringify({
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          price: parseFloat(formData.price) || 0,
          isFree: formData.isFree,
          recordEnabled: formData.recordEnabled,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create stream');
      }

      const result = await response.json();
      const data = {
        streamId: result.streamId,
        rtmpUrl: result.rtmpUrl,
        streamKey: result.streamKey,
        playbackId: result.playbackId ?? null,
        title: formData.title,
      };
      setStreamData(data);
      onSuccess?.(data);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to create stream');
    } finally {
      setLoading(false);
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
  }

  return (
    <div className="space-y-6">
      {!streamData ? (
        <>
          <div className="space-y-4">
            <div>
              <label htmlFor="stream-title" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="stream-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-black shadow-sm focus:border-black focus:outline-none focus:ring-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:focus:border-white dark:focus:ring-white"
                placeholder="Enter stream title"
                required
              />
            </div>

            <div>
              <label htmlFor="stream-description" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Description
              </label>
              <textarea
                id="stream-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-black shadow-sm focus:border-black focus:outline-none focus:ring-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:focus:border-white dark:focus:ring-white"
                placeholder="Enter stream description"
              />
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="stream-is-free"
                  checked={formData.isFree}
                  onChange={(e) => setFormData({ ...formData, isFree: e.target.checked })}
                  className="h-4 w-4 rounded border-zinc-300 text-black focus:ring-black dark:border-zinc-700 dark:focus:ring-white"
                />
                <label htmlFor="stream-is-free" className="ml-2 text-sm text-zinc-700 dark:text-zinc-300">
                  Free stream
                </label>
              </div>

              {!formData.isFree && (
                <div className="flex-1">
                  <label htmlFor="stream-price" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Price (USD)
                  </label>
                  <input
                    type="number"
                    id="stream-price"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    min="0"
                    step="0.01"
                    className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-black shadow-sm focus:border-black focus:outline-none focus:ring-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:focus:border-white dark:focus:ring-white"
                    placeholder="0.00"
                  />
                </div>
              )}
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="stream-record-enabled"
                  checked={formData.recordEnabled}
                  onChange={(e) => setFormData({ ...formData, recordEnabled: e.target.checked })}
                  className="h-4 w-4 rounded border-zinc-300 text-black focus:ring-black dark:border-zinc-700 dark:focus:ring-white"
                />
                <label htmlFor="stream-record-enabled" className="ml-2 text-sm text-zinc-700 dark:text-zinc-300">
                  Record this session (saves a VOD in Livepeer)
                </label>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                When enabled, Livepeer will capture the broadcast and create a replay automatically.
              </p>
            </div>
          </div>

          <button
            onClick={createStream}
            disabled={loading}
            className="rounded-md bg-black px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            {loading ? 'Creating Stream...' : 'Create Stream'}
          </button>
        </>
      ) : (
        <div className="space-y-8">
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-200">
            Stream created successfully! You can broadcast directly from your browser below, or use OBS with the credentials provided.
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-bold text-black dark:text-white">Broadcast Now</h3>
            <BroadcastPlayer 
              streamKey={streamData.streamKey} 
              title={streamData.title}
            />
          </div>

          <div className="space-y-4 border-t border-zinc-200 pt-8 dark:border-zinc-800">
            <h3 className="text-lg font-bold text-black dark:text-white">Stream Settings (OBS / External)</h3>
            
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                RTMP URL
              </label>
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={streamData.rtmpUrl}
                  className="flex-1 rounded-md border border-zinc-300 bg-zinc-50 px-3 py-2 font-mono text-sm text-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                />
                <button
                  onClick={() => copyToClipboard(streamData.rtmpUrl)}
                  className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                >
                  Copy
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Stream Key
              </label>
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={streamData.streamKey}
                  className="flex-1 rounded-md border border-zinc-300 bg-zinc-50 px-3 py-2 font-mono text-sm text-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                />
                <button
                  onClick={() => copyToClipboard(streamData.streamKey)}
                  className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                >
                  Copy
                </button>
              </div>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
                Keep this key secret! Do not share it publicly.
              </p>
            </div>

            <div className="rounded-md bg-zinc-100 p-4 dark:bg-zinc-900">
              <h3 className="mb-2 text-sm font-semibold text-black dark:text-white">
                How to stream
              </h3>
              <ol className="list-decimal space-y-1 pl-5 text-sm text-zinc-700 dark:text-zinc-300">
                <li>Use the <strong>Broadcast Now</strong> player above to stream directly from your browser.</li>
                <li>OR use external software:
                  <ul className="list-disc pl-5 mt-1 text-zinc-500">
                    <li>Open OBS / Streamlabs</li>
                    <li>Go to Settings → Stream</li>
                    <li>Select Service: Custom</li>
                    <li>Paste the RTMP URL and Stream Key</li>
                    <li>Click “Start Streaming”</li>
                  </ul>
                </li>
              </ol>
            </div>

            <div className="pt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Stream ID: {streamData.streamId}
            </div>
            
            <div className="pt-4">
               <button
                onClick={() => setStreamData(null)}
                className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400"
              >
                ← Create another stream
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
