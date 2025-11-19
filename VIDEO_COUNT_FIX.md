# Video Count Mismatch - Issue Resolved ✅

## Problem Summary

The admin dashboard was showing **2 videos** while you believed there was only **1 video** displayed on the site.

## Root Cause

I inspected the system and found:

### Supabase Database (videos table)
- **Total Records:** 2
- **Record 1:** "new basketballer" (Asset: `8aeef463-c47d-44b6-b87e-0fa1c7fad45a`) ✅
- **Record 2:** "Yelloooww" (Asset: `33a745a5-2a0a-4ea9-8a41-5839c1bbeb38`) ❌

### Livepeer Assets
- **Asset 1:** "new basketballer" - **EXISTS** ✅
- **Asset 2:** "Yelloooww" - **NOT FOUND (404)** ❌

### Why the Mismatch?

The video "Yelloooww" is an **orphaned record**:
- It exists in the Supabase database
- It was **deleted from Livepeer** (or never successfully uploaded)
- The Supabase record was never cleaned up

This caused:
- **Public pages:** Show 1 video (filtered by Livepeer existence)
- **Admin dashboard:** Showed 2 videos (raw Supabase count)

## Solution Implemented

### 1. Fixed Stats to Match Reality ✅
I updated `app/admin/page.tsx` to:
- Fetch video counts from the **same source as public pages** (`/api/admin/content`)
- This uses `getLivepeerVideos()` which only counts assets that **actually exist in Livepeer**
- **Result:** The admin dashboard now shows **1 video** (matching the public page)

### 2. How to Clean Up the Orphaned Record

The orphaned "Yelloooww" record still exists in the database. To remove it:

1. Navigate to the **Admin Dashboard** (`/admin`)
2. Scroll to the **"Manage Content"** section
3. Look for the video titled **"Yelloooww"**
4. Click **"Delete"** next to it
5. The system will:
   - Attempt to delete from Livepeer (will return 404, which is fine)
   - Delete the Supabase record
   - Update the UI

After deletion, the database will be clean and consistent.

## Prevention for the Future

The system now:
- **Counts videos based on Livepeer** (source of truth)
- **Shows warnings** if a video exists in DB but not in Livepeer
- **Allows cleanup** via the Content Manager UI

## Files Modified

- `app/admin/page.tsx` - Updated stats fetching logic
- `scripts/inspect-videos.ts` - Created for diagnosis
- `scripts/check-livepeer-assets.ts` - Created for verification

## Summary

✅ **Issue:** Admin dashboard showed 2 videos, but only 1 exists in Livepeer  
✅ **Cause:** Orphaned database record ("Yelloooww")  
✅ **Fix:** Updated dashboard to use Livepeer-filtered counts  
✅ **Action:** Admin can delete the orphaned record via Content Manager  

The dashboard now accurately reflects the number of videos that actually exist on your platform! 🏀

