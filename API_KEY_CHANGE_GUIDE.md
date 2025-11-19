# Livepeer API Key Change Guide

## What Happened?

You changed your Livepeer API key, but your Supabase database still contained videos with asset IDs from the **old** Livepeer account. When the app tried to play those videos using the **new** API key, Livepeer returned 404 errors because those assets don't exist in the new account.

## The Fix (Already Applied ✅)

We ran a cleanup script that deleted all old videos from your database:

```bash
npm run tsx scripts/clear-old-videos.ts
```

**Result**: All 5 old videos were deleted from the database.

## Database Structure

### Videos Table
```sql
CREATE TABLE videos (
  id UUID PRIMARY KEY,
  title TEXT,
  description TEXT,
  livepeer_asset_id TEXT,  -- ⚠️ This references a Livepeer asset
  thumbnail_url TEXT,
  status TEXT,
  is_free BOOLEAN,
  price_usd DECIMAL,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

**Key Point**: Each video row stores a `livepeer_asset_id` that is specific to **one Livepeer account**. If you change API keys (which means changing Livepeer accounts), the old asset IDs become invalid.

## How the System Works

### Video Upload Flow:
1. **Admin uploads video** → `POST /api/videos/upload`
2. **Server creates Livepeer asset** → Uses `LIVEPEER_API_KEY` from `.env.local`
3. **Returns TUS upload URL** → Client uploads video directly to Livepeer
4. **Asset ID saved to Supabase** → `livepeer_asset_id` column stores the asset ID
5. **Livepeer processes video** → Generates playback IDs and CDN URLs

### Video Playback Flow:
1. **User clicks video** → Frontend fetches video from Supabase
2. **Gets `livepeer_asset_id`** → From the database row
3. **Fetches playback info** → Calls `livepeer.playback.get(playbackId)` using `LIVEPEER_API_KEY`
4. **If API key changed** → Livepeer returns 404 (asset not found)
5. **Video fails to play** → Player shows "Video source unavailable"

## When to Clear Videos

You should clear the database videos when:

### ✅ **When to Clear:**
- Switching to a new Livepeer API key
- Switching to a different Livepeer account
- Testing with a new Livepeer account
- Starting fresh with new content

### ❌ **When NOT to Clear:**
- Rotating the same account's API key (asset IDs remain valid)
- Adding a secondary API key for the same account
- Temporary testing (you can keep old videos if they're from the same account)

## How to Clear Videos (Manual)

If you need to clear videos again in the future:

```bash
cd /Users/controlla/full-court
npm run tsx scripts/clear-old-videos.ts
```

Or manually via Supabase Dashboard:
1. Go to your Supabase project
2. Navigate to **Table Editor** → **videos**
3. Select all rows and delete

## How to Prevent This Issue

### Option 1: Keep the Same Livepeer Account
- Use the same Livepeer account across environments
- Just rotate API keys within the same account (asset IDs remain valid)

### Option 2: Environment-Specific Databases
- **Development**: Use test Livepeer account + local Supabase
- **Production**: Use production Livepeer account + production Supabase
- Never mix API keys and databases from different environments

### Option 3: Migration Script (For Production)
If you **must** change API keys in production with existing content:
1. Export video metadata from Supabase
2. Download actual video files from old Livepeer account
3. Re-upload to new Livepeer account
4. Update Supabase with new asset IDs

*This is complex and should be avoided. Better to keep the same Livepeer account.*

## Current Status ✅

- ✅ Database is clean (all old videos deleted)
- ✅ New Livepeer API key is configured in `.env.local`
- ✅ Video upload uses new API key
- ✅ Video playback uses new API key
- ✅ System is ready for fresh uploads

## Next Steps

1. **Go to**: http://localhost:3000/admin
2. **Upload new videos**: They will use your new Livepeer API key
3. **Verify playback**: New videos should play correctly
4. **Test on**: http://localhost:3000/test-video-playback

## Environment Variables

Make sure these are set in `.env.local`:

```bash
# Livepeer API Keys (must be from the SAME Livepeer account)
LIVEPEER_API_KEY=your-new-api-key-here
NEXT_PUBLIC_LIVEPEER_API_KEY=your-new-api-key-here

# Supabase (should match the Livepeer account environment)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Privy (for authentication)
NEXT_PUBLIC_PRIVY_APP_ID=your-privy-app-id

# Admin User IDs (comma-separated Privy user IDs)
ADMIN_USER_IDS=your-privy-user-id
```

## Technical Details

### Why Asset IDs Are Account-Specific

Livepeer asset IDs are UUIDs that identify videos within a specific Livepeer account. When you create a new API key in a **new account**, you get a completely fresh account with no assets. Your old asset IDs (like `d14412f2-d043-4ede-99eb-932b3c36a646`) only exist in the old account.

### The Relationship Chain

```
Supabase DB → stores → livepeer_asset_id
                ↓
         Valid only for
                ↓
    Specific Livepeer Account
                ↓
         Accessed via
                ↓
        LIVEPEER_API_KEY
```

If you change the API key (to a different account), the chain breaks, and videos can't be played.

## Troubleshooting

### "Video source unavailable" Error

**Cause**: Trying to play a video with an asset ID from a different Livepeer account.

**Solution**: 
1. Run `npm run tsx scripts/clear-old-videos.ts`
2. Re-upload videos with the new API key

### "Asset not found" in Console

**Cause**: Same as above - old asset ID with new API key.

**Console Log**:
```
[Livepeer Asset] API error: 404
[Playback ID] Error getting playback ID: Asset not found
```

**Solution**: Clear videos and re-upload.

### Videos Upload But Don't Play

**Cause**: Mixing API keys - upload uses one key, playback uses another.

**Check**: Make sure `LIVEPEER_API_KEY` and `NEXT_PUBLIC_LIVEPEER_API_KEY` are the **same** in `.env.local`.

**Solution**:
```bash
# Both should be the same!
LIVEPEER_API_KEY=your-api-key
NEXT_PUBLIC_LIVEPEER_API_KEY=your-api-key
```

## Scripts Reference

### Clear Old Videos
```bash
npm run tsx scripts/clear-old-videos.ts
```

### Test Livepeer SDK
```bash
npm run tsx scripts/test-livepeer-sdk.ts
```

### Verify Database
```bash
npm run tsx scripts/test-supabase.ts
```

### Check Video Status
```bash
curl http://localhost:3000/api/videos/debug
```

---

**Last Updated**: November 19, 2025  
**Status**: ✅ System cleaned and ready for new uploads

