'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useAuth } from '@/lib/auth/use-auth';

interface UploadProgress {
  status: 'idle' | 'uploading' | 'processing' | 'complete' | 'error';
  progress: number;
  message: string;
  videoId?: string;
}

interface VideoUploadFormProps {
  onSuccess?: (videoId: string) => void;
}

export function VideoUploadForm({ onSuccess }: VideoUploadFormProps) {
  const { userId } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '0',
    isFree: true,
  });
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    status: 'idle',
    progress: 0,
    message: '',
  });

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      setUploadProgress({
        status: 'error',
        progress: 0,
        message: 'Please upload a video file',
      });
      return;
    }

    await uploadVideo(file);
  }, [formData]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.mov', '.avi', '.webm', '.mkv'],
    },
    maxFiles: 1,
    disabled: uploadProgress.status === 'uploading' || uploadProgress.status === 'processing',
  });

  async function uploadVideo(file: File) {
    if (!formData.title.trim()) {
      setUploadProgress({
        status: 'error',
        progress: 0,
        message: 'Please enter a video title',
      });
      return;
    }

    setUploadProgress({
      status: 'uploading',
      progress: 0,
      message: 'Creating upload session...',
    });

    try {
      // Convert thumbnail to base64 if provided
      let thumbnailBase64: string | null = null;
      if (thumbnailFile) {
        thumbnailBase64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(thumbnailFile);
        });
      }

      // Step 1: Create asset and get upload URL (fast - just metadata)
      const createResponse = await fetch('/api/videos/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(userId ? { 'x-user-id': userId } : {}),
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          price: formData.price,
          isFree: formData.isFree,
          thumbnail: thumbnailBase64,
        }),
      });

      if (!createResponse.ok) {
        let error;
        try {
          error = await createResponse.json();
        } catch {
          error = { error: `Failed to create upload session: ${createResponse.status} ${createResponse.statusText}` };
        }
        console.error('Upload error response:', error);
        throw new Error(error.error || error.details || 'Failed to create upload session');
      }

      const result = await createResponse.json();

      if (!result.tusEndpoint) {
        throw new Error('No upload URL received from server');
      }

      // Step 2: Upload file directly to Livepeer using TUS (fast - direct upload)
      setUploadProgress({
        status: 'uploading',
        progress: 5,
        message: 'Uploading video to Livepeer...',
      });

      // Dynamically import TUS client
      const { Upload } = await import('tus-js-client');

      return new Promise<void>((resolve, reject) => {
        const upload = new Upload(file, {
          endpoint: result.tusEndpoint,
          retryDelays: [0, 1000, 3000, 5000],
          metadata: {
            filename: file.name,
            filetype: file.type,
          },
          onError: (error) => {
            console.error('TUS upload error:', error);
            setUploadProgress({
              status: 'error',
              progress: 0,
              message: `Upload failed: ${error.message || 'Unknown error'}`,
            });
            reject(error);
          },
          onProgress: (bytesUploaded, bytesTotal) => {
            const percentage = Math.round((bytesUploaded / bytesTotal) * 100);
            setUploadProgress({
              status: 'uploading',
              progress: Math.max(5, Math.min(95, percentage)),
              message: `Uploading... ${percentage}%`,
            });
          },
          onSuccess: async () => {
            setUploadProgress({
              status: 'processing',
              progress: 95,
              message: 'Video uploaded! Processing...',
            });

            // Immediately update status from Livepeer after upload completes
            if (result.videoId) {
              try {
                // Trigger immediate status update
                await fetch(`/api/videos/${result.videoId}/update-status`, {
                  method: 'POST',
                });
              } catch (error) {
                console.error('Error updating status immediately:', error);
              }
              
              // Start polling for status updates
              pollVideoStatus(result.videoId);
            } else {
              setUploadProgress({
                status: 'complete',
                progress: 100,
                message: 'Video uploaded successfully!',
                videoId: result.videoId,
              });
              onSuccess?.(result.videoId);
            }
            resolve();
          },
        });

        upload.start();
      });
    } catch (error) {
      setUploadProgress({
        status: 'error',
        progress: 0,
        message: error instanceof Error ? error.message : 'Upload failed',
      });
    }
  }

  async function pollVideoStatus(videoId: string) {
    const maxAttempts = 60; // Increased to 60 attempts (2 minutes)
    let attempts = 0;

    const interval = setInterval(async () => {
      attempts++;
      try {
        // First, update status from Livepeer
        const updateResponse = await fetch(`/api/videos/${videoId}/update-status`, {
          method: 'POST',
        });

        // Then fetch the updated video
        const response = await fetch(`/api/videos/${videoId}`);
        if (!response.ok) throw new Error('Failed to fetch video status');

        const { video } = await response.json();

        if (video.status === 'ready') {
          clearInterval(interval);
          setUploadProgress({
            status: 'complete',
            progress: 100,
            message: 'Video is ready!',
            videoId: video.id,
          });
          onSuccess?.(video.id);
        } else if (video.status === 'error') {
          clearInterval(interval);
          setUploadProgress({
            status: 'error',
            progress: 0,
            message: 'Video processing failed',
          });
        } else if (attempts >= maxAttempts) {
          clearInterval(interval);
          setUploadProgress({
            status: 'processing',
            progress: 75,
            message: 'Video is still processing. Check back later.',
            videoId: video.id,
          });
        } else {
          // Update progress message
          setUploadProgress({
            status: 'processing',
            progress: Math.min(95, 60 + (attempts / maxAttempts) * 15),
            message: `Processing... (${attempts}/${maxAttempts})`,
            videoId: video.id,
          });
        }
      } catch (error) {
        console.error('Error polling video status:', error);
        if (attempts >= maxAttempts) {
          clearInterval(interval);
          setUploadProgress({
            status: 'processing',
            progress: 75,
            message: 'Video is still processing. Check back later.',
            videoId,
          });
        }
      }
    }, 2000);
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-black shadow-sm focus:border-black focus:outline-none focus:ring-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:focus:border-white dark:focus:ring-white"
            placeholder="Enter video title"
            required
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Description
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={4}
            className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-black shadow-sm focus:border-black focus:outline-none focus:ring-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:focus:border-white dark:focus:ring-white"
            placeholder="Enter video description"
          />
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isFree"
              checked={formData.isFree}
              onChange={(e) => setFormData({ ...formData, isFree: e.target.checked })}
              className="h-4 w-4 rounded border-zinc-300 text-black focus:ring-black dark:border-zinc-700 dark:focus:ring-white"
            />
            <label htmlFor="isFree" className="ml-2 text-sm text-zinc-700 dark:text-zinc-300">
              Free video
            </label>
          </div>

          {!formData.isFree && (
            <div className="flex-1">
              <label htmlFor="price" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Price (USD)
              </label>
              <input
                type="number"
                id="price"
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

        {/* Thumbnail Upload */}
        <div>
          <label htmlFor="thumbnail" className="block text-sm font-medium text-white/80 mb-2">
            Thumbnail Image
          </label>
          <div className="flex items-start gap-4">
            {thumbnailPreview && (
              <div className="relative w-32 h-18 rounded-lg overflow-hidden border-2 border-[#FF6B35]/30 shadow-lg">
                <img 
                  src={thumbnailPreview} 
                  alt="Thumbnail preview" 
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => {
                    setThumbnailFile(null);
                    setThumbnailPreview(null);
                  }}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center text-xs transition-colors"
                >
                  ×
                </button>
              </div>
            )}
            <label 
              htmlFor="thumbnail"
              className="flex-1 cursor-pointer rounded-lg border-2 border-dashed border-[#FF6B35]/30 bg-black/40 p-4 text-center transition-all hover:border-[#FF6B35]/60 hover:bg-black/60"
            >
              <svg
                className="mx-auto h-8 w-8 text-[#FF6B35]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p className="mt-2 text-xs text-white/60">
                {thumbnailFile ? thumbnailFile.name : 'Click to upload thumbnail'}
              </p>
              <p className="mt-1 text-xs text-white/40">
                PNG, JPG, WebP (16:9 recommended)
              </p>
              <input
                type="file"
                id="thumbnail"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setThumbnailFile(file);
                    // Create preview
                    const reader = new FileReader();
                    reader.onload = () => setThumbnailPreview(reader.result as string);
                    reader.readAsDataURL(file);
                  }
                }}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>

      <div className="rounded-lg border-2 border-dashed border-[#FF6B35]/30 bg-black/20 p-6 text-center transition-all hover:border-[#FF6B35]/60 hover:bg-black/40"
        {...getRootProps()}
      >
        <input {...getInputProps()} />
        <svg
          className="mx-auto h-12 w-12 text-[#FF6B35]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
        <p className="mt-4 text-sm text-white/70">
          {isDragActive ? 'Drop the video file here' : 'Drag and drop a video file here, or click to select'}
        </p>
        <p className="mt-2 text-xs text-white/50">
          Supported formats: MP4, MOV, AVI, WebM, MKV
        </p>
      </div>

      {uploadProgress.status !== 'idle' && (
        <div>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-white/70">{uploadProgress.message}</span>
            <span className="text-white/70 font-bold">{uploadProgress.progress}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-black/40">
            <div
              className="h-full bg-gradient-to-r from-[#FF6B35] to-[#FF3366] transition-all duration-300 shadow-lg shadow-[#FF6B35]/50"
              style={{ width: `${uploadProgress.progress}%` }}
            />
          </div>

          {uploadProgress.status === 'complete' && uploadProgress.videoId && (
            <div className="mt-4">
              <a
                href={`/videos/${uploadProgress.videoId}`}
                className="inline-block px-6 py-2 text-sm font-bold text-white bg-gradient-to-r from-[#FF6B35] to-[#FF3366] rounded-lg hover:scale-105 transition-transform duration-200 shadow-lg shadow-[#FF6B35]/50"
              >
                View video →
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

