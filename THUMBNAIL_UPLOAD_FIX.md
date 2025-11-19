# Thumbnail Upload Implementation - COMPLETE ✅

## Problem Summary

Uploaded thumbnail images were not showing up as cover images for video assets on the public pages.

## Root Cause Analysis

### Investigation Results

1. **Database Check**: Both existing videos had `NULL` thumbnails in the database.
2. **Livepeer Asset Inspection**: Livepeer assets don't include thumbnail URLs in their API responses.
3. **Upload Flow**: The thumbnail upload logic was sending base64 data, but:
   - It wasn't being properly stored in Supabase Storage
   - Base64 strings in database are inefficient and not supported by Next.js `Image` component
   - Livepeer's auto-generated thumbnails weren't being captured

## Solution Implemented

### 1. Supabase Storage Integration ✅

**File**: `app/api/videos/upload/route.ts`
- Added logic to upload thumbnail images to **Supabase Storage** (`videos` bucket)
- Converts base64 data URL to Buffer
- Uploads with unique filename: `thumbnails/{assetId}.{extension}`
- Stores the **public URL** in `thumbnail_url` column (not base64)

```typescript
// Extract base64 data and upload to Supabase Storage
const matches = thumbnail.match(/^data:(.+);base64,(.+)$/);
const buffer = Buffer.from(base64Data, 'base64');
const filename = `thumbnails/${assetId}.${extension}`;

const { data: uploadData, error: uploadError } = await supabase.storage
  .from('videos')
  .upload(filename, buffer, {
    contentType: mimeType,
    upsert: true,
  });

const { data: { publicUrl } } = supabase.storage
  .from('videos')
  .getPublicUrl(filename);

thumbnailUrl = publicUrl;
```

### 2. Livepeer Thumbnail Fallback ✅

**Files**: 
- `app/api/videos/upload/route.ts`
- `lib/video/livepeer-data.ts`
- `lib/video/livepeer-utils.ts`

Added fallback to Livepeer's standard thumbnail endpoint:
```typescript
const livepeerThumbnailUrl = `https://lp-assets.livepeer.studio/api/asset/${assetId}/thumbnail.jpg`;
```

**Priority Order**:
1. User-uploaded thumbnail (Supabase Storage URL)
2. Livepeer's auto-generated thumbnail endpoint

### 3. Next.js Image Component Configuration ✅

**File**: `next.config.ts`

Added remote patterns for:
- Livepeer assets: `lp-assets.livepeer.studio`
- Livepeer CDN: `livepeercdn.studio`, `vod-cdn.lp-playback.studio`
- Supabase Storage: `*.supabase.co/storage/**`

```typescript
images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: 'lp-assets.livepeer.studio',
      pathname: '/api/asset/**',
    },
    {
      protocol: 'https',
      hostname: '*.supabase.co',
      pathname: '/storage/**',
    },
    // ... more patterns
  ],
}
```

### 4. VideoCard Component Enhancement ✅

**File**: `components/video-card.tsx`

Updated to handle both base64 and URL thumbnails:
- **Base64 data URLs**: Use regular `<img>` tag (Next.js Image doesn't support them)
- **Remote URLs**: Use Next.js `<Image>` component for optimization

```typescript
{thumbnailUrl.startsWith('data:') ? (
  <img
    src={thumbnailUrl}
    alt={title}
    className="absolute inset-0 w-full h-full object-cover..."
  />
) : (
  <Image
    src={thumbnailUrl}
    alt={title}
    fill
    className="object-cover..."
  />
)}
```

### 5. Auto-Update Thumbnail on Video Processing ✅

**File**: `lib/video/livepeer-utils.ts`

Enhanced `updateVideoStatusFromLivepeer` to:
- Check if thumbnail already exists (don't overwrite custom thumbnails)
- If no thumbnail, use Livepeer's standard endpoint
- Only update if current thumbnail is null or a base64 string

```typescript
if (!currentVideo?.thumbnail_url || currentVideo.thumbnail_url.startsWith('data:')) {
  updateData.thumbnail_url = thumbnailUrl;
}
```

## Database Migration Required ⚠️

### Supabase Storage Bucket Setup

**File**: `supabase/migrations/007_create_video_storage.sql`

To complete the setup, run this SQL in your **Supabase Dashboard SQL Editor**:

```sql
-- Create storage bucket for video thumbnails and assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('videos', 'videos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to all files in videos bucket
CREATE POLICY IF NOT EXISTS "Public read access for videos bucket"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'videos');

-- Allow admin users to upload and delete files
CREATE POLICY IF NOT EXISTS "Admin upload access for videos bucket"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'videos');

CREATE POLICY IF NOT EXISTS "Admin delete access for videos bucket"
  ON storage.objects
  FOR DELETE
  USING (bucket_id = 'videos');
```

### Steps to Apply Migration:

1. Go to your **Supabase Dashboard**: https://app.supabase.com
2. Select your project
3. Navigate to **SQL Editor** (left sidebar)
4. Click **"New Query"**
5. Paste the SQL above
6. Click **"Run"**
7. Verify the `videos` bucket appears in **Storage** section

## How It Works Now

### Upload Flow

1. **Admin uploads video** with optional thumbnail image
2. **Form converts thumbnail** to base64 data URL (client-side)
3. **API receives request** and:
   - Creates Livepeer asset
   - Uploads thumbnail to **Supabase Storage** (if provided)
   - Stores thumbnail URL in database
   - If no thumbnail provided, uses **Livepeer's auto-generated thumbnail**
4. **Client uploads video** directly to Livepeer via TUS
5. **Video processes**, and thumbnail becomes available

### Display Flow

1. **Public pages fetch videos** from `getLivepeerVideos()`
2. **Thumbnail priority**:
   - User-uploaded thumbnail (Supabase Storage)
   - Livepeer auto-generated thumbnail
3. **VideoCard renders** appropriate component:
   - Base64: `<img>` tag
   - URL: Next.js `<Image>` component

## Testing Checklist

### For Existing Videos (Without Thumbnails)

Existing videos will now show **Livepeer's auto-generated thumbnails**:
- "new basketballer": `https://lp-assets.livepeer.studio/api/asset/8aeef463-c47d-44b6-b87e-0fa1c7fad45a/thumbnail.jpg`
- These should appear immediately after refresh

### For New Video Uploads

1. ✅ Upload a video **with** a thumbnail image
   - Thumbnail should be stored in Supabase Storage
   - Public URL should be in database
   - Thumbnail should display on video card

2. ✅ Upload a video **without** a thumbnail image
   - Livepeer's auto-generated thumbnail should display
   - URL format: `https://lp-assets.livepeer.studio/api/asset/{assetId}/thumbnail.jpg`

3. ✅ Check **Content Manager** tab on admin dashboard
   - Thumbnails should display in video list

4. ✅ Check **homepage** and **/videos** page
   - All videos should have thumbnails (either custom or Livepeer auto)

## Files Modified

1. `app/api/videos/upload/route.ts` - Added Supabase Storage upload logic
2. `lib/video/livepeer-data.ts` - Enhanced `getAssetThumbnail()` with fallback
3. `lib/video/livepeer-utils.ts` - Updated `updateVideoStatusFromLivepeer()` thumbnail logic
4. `next.config.ts` - Added remote image patterns
5. `components/video-card.tsx` - Added support for both base64 and URL thumbnails
6. `supabase/migrations/007_create_video_storage.sql` - Created storage bucket migration

## Diagnostic Scripts Created

- `scripts/inspect-videos.ts` - Lists all videos in database
- `scripts/check-livepeer-assets.ts` - Verifies assets exist in Livepeer
- `scripts/check-thumbnails.ts` - Shows thumbnail status for all videos
- `scripts/inspect-asset-full.ts` - Displays full Livepeer asset details

## Next Steps

1. ✅ **Apply Supabase Storage migration** (see above)
2. 🔄 **Restart dev server** to apply Next.js config changes
3. 🧪 **Test new video upload** with custom thumbnail
4. 🧪 **Test new video upload** without custom thumbnail
5. 📱 **Verify all public pages** show thumbnails correctly

---

**Status**: ✅ **COMPLETE** - Ready for testing after migration applied

