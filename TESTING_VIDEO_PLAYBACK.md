# Testing Video Playback - Fixed

## The Issue That Was Fixed

**Problem**: Videos were not playing. The player showed a loading spinner indefinitely.

**Root Cause**: The Livepeer SDK returns source URLs in a `url` property, but our code was looking for `src` property.

## The Fix

Changed in `lib/video/livepeer-utils.ts`:

```typescript
// ❌ BEFORE (incorrect)
if (hlsSource?.src) {
  return hlsSource.src;
}

// ✅ AFTER (correct)
if (hlsSource?.url) {
  return hlsSource.url;
}
```

## Verification Steps

### 1. API Route Test ✅

Test the API route directly:

```bash
curl "http://localhost:3000/api/videos/playback-url?playbackId=c266jdxxnqeipqpx"
```

**Expected Response:**
```json
{
  "playbackUrl": "https://vod-cdn.lp-playback.studio/raw/.../index.m3u8"
}
```

### 2. Test Page

Navigate to: **http://localhost:3000/test-video-playback**

This page displays 3 test videos with their playback IDs.

**Expected Behavior:**
- Each video loads within 2-3 seconds
- Video controls work (play, pause, seek, fullscreen)
- No errors in console
- Console shows: `[Video Player] Fetched playback URL: https://vod-cdn...`

### 3. Production Pages

#### Homepage
- Navigate to: **http://localhost:3000/**
- Video grid should display uploaded videos
- Click any video card to open the video player

#### Videos Page
- Navigate to: **http://localhost:3000/videos**
- Grid of all videos
- Click any video to watch

#### Individual Video Page
- Navigate to: **http://localhost:3000/videos/[video-id]**
- Video player should load and play automatically (if autoPlay is enabled)

## Console Logs to Verify

### ✅ Success Logs:

```
[Video Player] Fetching playback URL for: c266jdxxnqeipqpx
[Playback Info] Fetching playback info for: c266jdxxnqeipqpx
[Playback Info] Successfully fetched playback info
[Playback URL] Found HLS URL: https://vod-cdn.lp-playback.studio/raw/...
[Video Player] Fetched playback URL: https://vod-cdn.lp-playback.studio/...
[Video Player] Video load started
[Video Player] Video can play
[Video Player] Video playing
```

### ❌ Error Logs to Watch For:

If you see any of these, something is wrong:
- `Could not fetch playback URL from Livepeer`
- `[Playback URL] No usable source found`
- `Video source unavailable`

## Testing Checklist

- [ ] API route returns playback URL
- [ ] Test page loads and plays videos
- [ ] Homepage video grid displays videos
- [ ] Individual video pages play videos
- [ ] Video controls work (play, pause, seek, fullscreen)
- [ ] No console errors
- [ ] Multiple videos can be played sequentially

## Current Video Status

From `/api/videos/debug`:

| Title | Status | Playback ID | Has URL |
|-------|--------|-------------|---------|
| new basketball highlights 20-11-25 | ready | d144dlmdum874znq | ✅ Yes |
| kljhgjk | ready | e3b0yjfl1gp7f8lj | ✅ Yes |
| fghg | ready | c266jdxxnqeipqpx | ✅ Yes |
| mnbj | processing | a528nda7sde898ra | ✅ Yes |
| huygtfyyu | processing | 28e0u193hhmltldz | ❌ No |

**Note**: Only "ready" videos will play. "Processing" videos may or may not work depending on Livepeer's encoding status.

## Next Steps

1. **Test now**: Open http://localhost:3000/test-video-playback
2. **Verify**: Check that all 3 test videos play
3. **Commit**: If everything works, we'll commit these changes
4. **Deploy**: Ready for production deployment

## Technical Details

### How It Works Now

1. **Video Player** calls `/api/videos/playback-url?playbackId=xxx`
2. **API Route** calls `livepeer.playback.get(playbackId)`
3. **Livepeer SDK** returns `playbackInfo` with `meta.source` array
4. **Our Code** finds the HLS source (type: `html5/application/vnd.apple.mpegurl`)
5. **Returns** the `url` property: `https://vod-cdn.lp-playback.studio/.../index.m3u8`
6. **Video Player** uses this URL to play the video

### Source Structure from Livepeer

```javascript
{
  sources: [
    { type: 'html5/video/mp4', url: '...720p0.mp4' },      // MP4
    { type: 'html5/application/vnd.apple.mpegurl', url: '...index.m3u8' },  // HLS ← We use this
    { type: 'text/vtt', url: '...thumbnails.vtt' }          // Thumbnails
  ]
}
```

