# Livepeer Video Upload & Livestream Setup

## Overview

This document describes how video uploads and livestreams work in the Full Court platform.

## Video Upload Flow

### 1. Upload Process (`/api/videos/upload`)

1. **Admin Authentication**: Checks if user is admin via `x-user-id` header
2. **File Upload to Livepeer**: Uploads video file to Livepeer Studio API
3. **Extract Metadata**: Extracts asset ID, playback ID, and thumbnail from Livepeer response
4. **Database Record**: Creates video record in Supabase with:
   - `livepeer_asset_id`: The Livepeer asset ID
   - `status`: 'processing' or 'ready' (based on Livepeer status)
   - `thumbnail_url`: If available from Livepeer
5. **Status Updates**: Client polls for status updates until video is 'ready'

### 2. Video Display

- **Public Pages**: Videos with `status='ready'` are displayed on:
  - Homepage (`/`) - Shows up to 12 latest videos
  - Videos page (`/videos`) - Shows all ready videos
- **Playback**: When viewing a video, the system:
  1. Fetches playback ID from Livepeer API using asset ID
  2. Falls back to asset ID if playback ID fetch fails
  3. Uses Livepeer player to display video

## Livestream Flow

### 1. Stream Creation (`/api/streams/create`)

**Important**: Each admin user has a **single persistent livestream ID**. New "Go Live" sessions reuse the same stream.

1. **Admin Authentication**: Checks if user is admin
2. **Check Existing Stream**: Looks for existing stream with `admin_user_id = userId`
3. **Reuse or Create**:
   - **If stream exists**: Reuses the same Livepeer stream ID, updates title/description
   - **If no stream**: Creates new Livepeer stream and stores `admin_user_id`
4. **Return Credentials**: Returns RTMP URL, stream key, and playback ID

### 2. Stream Sessions

- Each admin user has **one persistent stream** in Livepeer
- When admin clicks "Go Live", it:
  - Reuses the existing stream (if it exists)
  - Updates the stream metadata (title, description)
  - Returns the same RTMP credentials
- This allows admins to stream multiple sessions using the same stream ID

### 3. Stream Display

- **Public Pages**: Streams are displayed on:
  - Homepage (`/`) - Shows latest live stream at the top
  - Streams page (`/streams`) - Shows all streams
- **Live Status**: Streams show "LIVE" indicator when `is_live = true`

## Database Schema

### Videos Table
- `livepeer_asset_id`: Livepeer asset ID (used to fetch playback ID)
- `status`: 'processing', 'ready', or 'error'
- `thumbnail_url`: Video thumbnail from Livepeer

### Streams Table
- `livepeer_stream_id`: Persistent Livepeer stream ID (reused per admin)
- `admin_user_id`: Admin user who owns this stream
- `rtmp_ingest_url`: RTMP URL for streaming
- `stream_key`: Stream key for authentication
- `is_live`: Whether stream is currently live

## Migration Required

Run this migration to add `admin_user_id` to streams table:

```sql
-- File: supabase/migrations/003_add_admin_user_id_to_streams.sql
ALTER TABLE streams 
ADD COLUMN IF NOT EXISTS admin_user_id TEXT;

CREATE INDEX IF NOT EXISTS idx_streams_admin_user_id ON streams(admin_user_id);

ALTER TABLE streams 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
```

## Testing

### Test Video Upload
1. Go to `/admin` page
2. Fill out video upload form
3. Upload a video file
4. Wait for processing (status will update to 'ready')
5. Check homepage and `/videos` page - video should appear

### Test Livestream
1. Go to `/admin` page
2. Fill out "Go Live" form
3. First time: Creates new stream, returns RTMP credentials
4. Second time: Reuses same stream, updates metadata
5. Use RTMP credentials in OBS/Streamlabs
6. Stream should appear on homepage when live

## Troubleshooting

### Videos not showing
- Check video `status` in database - must be 'ready'
- Verify `livepeer_asset_id` is correct
- Check browser console for playback ID fetch errors

### Stream not working
- Verify `admin_user_id` is set in streams table
- Check that RTMP credentials are correct
- Verify stream is active in Livepeer dashboard
- Check `is_live` status in database

### Playback ID issues
- System automatically fetches playback ID from Livepeer API
- Falls back to asset ID if fetch fails
- Check Livepeer API response format if issues persist

