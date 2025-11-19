# Video Playback Fix

## Issue
Uploaded videos were not playing in the video player. The player showed a loading spinner indefinitely.

## Root Cause
The video player was manually constructing CDN URLs instead of using the Livepeer SDK's proper `playback.get()` method to fetch playback information.

## Solution

### 1. Updated Livepeer Utils (`lib/video/livepeer-utils.ts`)

Added a new `getPlaybackInfo()` function that matches the working implementation pattern:

```typescript
export async function getPlaybackInfo(playbackId: string): Promise<any | null> {
  const livepeer = getLivepeerClient();
  const result = await livepeer.playback.get(playbackId);
  
  if (!result.playbackInfo) {
    return null;
  }
  
  return result.playbackInfo;
}
```

Updated `getPlaybackUrl()` to use the new `getPlaybackInfo()` method:
- Calls `livepeer.playback.get(playbackId)` via SDK
- Extracts `result.playbackInfo` from the response
- Parses the HLS source URL from `playbackInfo.meta.source`

### 2. Updated Video Player (`components/video-player.tsx`)

Changed from manual URL construction to dynamic URL fetching:

**Before:**
```typescript
// Manually constructed URLs (incorrect)
const hlsUrl = `https://livepeercdn.com/hls/${playbackId}/index.m3u8`;
```

**After:**
```typescript
// Dynamically fetch the correct URL from Livepeer API
useEffect(() => {
  fetch(`/api/videos/playback-url?playbackId=${playbackId}`)
    .then(response => response.json())
    .then(data => setPlaybackUrl(data.playbackUrl));
}, [playbackId]);
```

### 3. Added Proper Loading States

- Shows loading spinner while fetching the playback URL
- Displays clear error messages if URL fetch fails
- Provides user feedback throughout the loading process

## Key Changes

1. **SDK Method**: Now using `livepeer.playback.get(playbackId)` as per official SDK patterns
2. **Dynamic URLs**: Fetching actual CDN URLs from Livepeer instead of guessing the format
3. **Error Handling**: Better error messages and loading states
4. **Async Loading**: Video player waits for the correct URL before attempting playback

## Testing

After restarting the server:

1. Navigate to the homepage or `/videos` page
2. Click on any uploaded video
3. The video player should:
   - Show "Loading video..." briefly
   - Fetch the correct playback URL from Livepeer
   - Display the video with full controls (play, pause, seek, fullscreen, etc.)

## Reference

This fix was based on a working Livepeer implementation that uses:
```typescript
const result = await livepeer.playback.get(playbackId);
return result.playbackInfo;
```

The key insight was that `playbackInfo` contains the proper CDN URLs and source information that the video player needs.

