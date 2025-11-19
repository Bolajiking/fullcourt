# Livepeer as Source of Truth - Configuration Guide

## ✅ **Current Status**

| Component | Status | Details |
|-----------|--------|---------|
| Database | ✅ Clean | 0 videos |
| Livepeer Account | ✅ Active | API Key: `84ec...af0a` (0 assets) |
| Server | ✅ Running | Fresh environment variables loaded |
| Public Pages | ✅ Clean | No old videos displayed |

---

## 🎯 **How the System Works**

### **The Source of Truth Flow**

```
LIVEPEER ACCOUNT (API Key: 84ec...af0a)
         ↓
    Contains: Assets (videos) & Streams (live streams)
         ↓
    Referenced by: Database (Supabase)
         ↓
    Displayed on: Public Pages (Homepage, /videos, /streams)
```

**Key Principle**: The Livepeer account is the **source of truth**. The database only stores **references** (asset IDs) to Livepeer assets.

---

## 🔍 **What Just Happened**

### **Problem**
You saw 2 "old" videos on the public page:
- "Yaaa" (uploaded 15:10)
- "new video" (uploaded 15:04)

### **Root Cause**
These videos were uploaded **before the server restart**, when the server was still using the **old API key** cached in memory.

**Timeline**:
1. **15:04 & 15:10** - Videos uploaded using OLD API key (still in memory)
2. **15:20** - Server restarted with NEW API key
3. **Result** - Videos in database reference OLD Livepeer account assets

### **Why They Were "Old"**
The asset IDs in the database (`d49c5fbc...` and `8c50ea46...`) pointed to assets in the OLD Livepeer account. When the app tried to play them using the NEW API key, they failed because:
- NEW Livepeer account: 0 assets
- OLD Livepeer account: Has those 2 assets (but we can't access them with the new key)

### **Solution Applied**
Deleted those 2 videos from the database using `clear-old-videos.ts`.

---

## 📋 **Ensuring Livepeer is Always the Source of Truth**

### **Rule 1: Always Restart After Changing API Keys**

When you change the Livepeer API key in `.env.local`:

```bash
# 1. Stop the server
pkill -f "next dev"

# 2. Verify new API key is in .env.local
cat .env.local | grep LIVEPEER

# 3. Clear old videos from database
npm run tsx scripts/clear-old-videos.ts

# 4. Start fresh
npm run dev
```

### **Rule 2: Verify Before Uploading**

Before uploading any videos, verify which Livepeer account is active:

```bash
cd /Users/controlla/full-court
npm run tsx scripts/verify-livepeer-account.ts
```

**Expected Output**:
```
📋 Current API Key: 84ec8662-2528-4dcd-a...af0a
✅ No assets found in this Livepeer account
   This appears to be your NEW Livepeer account (clean)
```

### **Rule 3: Sync Database with Livepeer**

The database should ONLY contain videos that exist in your current Livepeer account.

**To Verify Sync**:
```bash
# Check Livepeer account
npm run tsx scripts/verify-livepeer-account.ts

# Check database
curl http://localhost:3000/api/videos | python3 -m json.tool
```

**They should match**: Same number of assets/videos.

---

## 🚀 **Correct Upload Flow (Source of Truth)**

### **Step-by-Step**

1. **User Uploads Video** → Admin panel at `/admin`
   - User selects video file
   - Enters title, description

2. **Server Creates Asset in Livepeer**
   - Uses `LIVEPEER_API_KEY` from environment
   - Calls `livepeer.asset.create({ name: title })`
   - Livepeer returns: `{ id: 'asset-uuid', tusEndpoint: 'upload-url' }`

3. **Client Uploads Video to Livepeer**
   - Uses TUS protocol
   - Uploads directly to Livepeer's CDN
   - No server involvement (fast, efficient)

4. **Server Saves Reference to Database**
   - Stores: `livepeer_asset_id`, title, description
   - Database row: `{ id: 'db-uuid', livepeer_asset_id: 'asset-uuid', title: '...', status: 'processing' }`

5. **Livepeer Processes Video**
   - Transcodes to multiple resolutions
   - Generates playback IDs
   - Status changes: `processing` → `ready`

6. **User Views Video on Public Page**
   - App fetches video from database (gets `livepeer_asset_id`)
   - App calls `livepeer.playback.get(playbackId)` using `LIVEPEER_API_KEY`
   - Livepeer returns CDN URLs
   - Video plays

---

## 🔒 **Maintaining Source of Truth**

### **Daily Operations**

#### ✅ **Correct: Add New Video**
```bash
# 1. Verify account
npm run tsx scripts/verify-livepeer-account.ts

# 2. Upload via admin panel
# http://localhost:3000/admin

# 3. Verify asset was created in Livepeer
npm run tsx scripts/verify-livepeer-account.ts
# Should show 1 more asset

# 4. Verify database was updated
curl http://localhost:3000/api/videos
# Should show 1 more video
```

#### ❌ **Incorrect: Manually Add Database Entry**
```bash
# DON'T DO THIS:
# Manually inserting into database without corresponding Livepeer asset
# This breaks the source of truth principle
```

#### ✅ **Correct: Change API Key**
```bash
# 1. Update .env.local with new key
# 2. Kill server
pkill -f "next dev"

# 3. Clear database
npm run tsx scripts/clear-old-videos.ts

# 4. Start fresh
npm run dev

# 5. Verify
npm run tsx scripts/verify-livepeer-account.ts
```

---

## 🧪 **Testing Source of Truth**

### **Test 1: Upload Flow**
```bash
# Start: 0 assets in Livepeer, 0 videos in database

# Upload 1 video via /admin

# Check Livepeer account
npm run tsx scripts/verify-livepeer-account.ts
# Expected: 1 asset

# Check database
curl http://localhost:3000/api/videos | python3 -m json.tool | grep "title"
# Expected: 1 video

# ✅ PASS: Counts match
```

### **Test 2: Playback**
```bash
# 1. Upload video via /admin
# 2. Wait for status: "ready" (1-2 minutes)
# 3. Go to http://localhost:3000/
# 4. Click video
# 5. Should play successfully

# If it plays → ✅ Source of truth is working
# If it fails → ❌ Asset ID mismatch (wrong API key)
```

### **Test 3: API Key Change**
```bash
# 1. Note current asset count
npm run tsx scripts/verify-livepeer-account.ts

# 2. Change API key in .env.local (simulate account change)

# 3. Restart server (WITHOUT clearing database)
pkill -f "next dev" && npm run dev

# 4. Go to homepage
# Expected: Videos fail to play (broken source of truth)

# 5. Fix: Clear database
npm run tsx scripts/clear-old-videos.ts

# 6. Refresh homepage
# Expected: No videos shown (source of truth restored)

# ✅ PASS: System correctly reflects Livepeer account state
```

---

## 📊 **Monitoring Source of Truth**

### **Quick Health Check**
```bash
# Run this command anytime to verify sync:
echo "Livepeer Assets:" && npm run tsx scripts/verify-livepeer-account.ts 2>&1 | grep "Found" && echo "\nDatabase Videos:" && curl -s http://localhost:3000/api/videos | python3 -m json.tool | grep "title"
```

### **Expected Output (Healthy)**:
```
Livepeer Assets:
Found 3 assets in this Livepeer account

Database Videos:
    "title": "Video 1",
    "title": "Video 2",
    "title": "Video 3",
```

**Counts should match**: 3 assets = 3 videos

### **Warning Signs (Broken Source of Truth)**:
- ❌ Different counts (5 videos in DB, but 3 assets in Livepeer)
- ❌ Videos won't play (asset IDs point to different account)
- ❌ Console errors: "Asset not found" or "404"

---

## 🛠️ **Troubleshooting**

### **Issue: "I see old videos"**

**Diagnosis**:
```bash
# 1. Check Livepeer account
npm run tsx scripts/verify-livepeer-account.ts

# 2. Check database
curl http://localhost:3000/api/videos | python3 -m json.tool

# 3. Compare counts and asset IDs
```

**Fix**:
```bash
# If counts don't match or asset IDs are different:
npm run tsx scripts/clear-old-videos.ts

# Then re-upload videos via /admin
```

### **Issue: "Videos won't play"**

**Diagnosis**:
```bash
# Check console errors in browser (F12)
# Look for: "Asset not found", "404", "Could not fetch playback URL"
```

**Cause**: Asset IDs in database don't exist in current Livepeer account (wrong API key)

**Fix**:
```bash
# 1. Verify correct API key is loaded
cat .env.local | grep LIVEPEER

# 2. Restart server
pkill -f "next dev" && npm run dev

# 3. Clear database
npm run tsx scripts/clear-old-videos.ts

# 4. Re-upload videos
```

### **Issue: "Uploaded video doesn't appear"**

**Diagnosis**:
```bash
# 1. Check if asset was created in Livepeer
npm run tsx scripts/verify-livepeer-account.ts

# 2. Check if video is in database
curl http://localhost:3000/api/videos | python3 -m json.tool

# 3. Check video status
curl http://localhost:3000/api/videos/debug | python3 -m json.tool | grep "status"
```

**Possible Causes**:
- Video status is `processing` (wait 1-2 minutes)
- Upload failed (check browser console for errors)
- RLS policy blocking (shouldn't happen with service role key)

**Fix**:
```bash
# If status is "processing", wait and refresh

# If upload failed, try again with smaller video file
```

---

## 📝 **Best Practices**

### **1. One API Key = One Environment**
- Development: Use one Livepeer account + local Supabase
- Production: Use different Livepeer account + production Supabase
- Never mix API keys and databases from different environments

### **2. Always Clean When Switching**
```bash
# Switching API key? Always clean first:
npm run tsx scripts/clear-old-videos.ts
```

### **3. Verify After Every Change**
```bash
# Changed .env.local? Verify:
npm run tsx scripts/verify-livepeer-account.ts
```

### **4. Document API Key Changes**
Keep a log of when you change API keys:
```
2025-11-19 15:20 - Changed from OLD key to 84ec...af0a
                  - Cleared database
                  - All new uploads use new account
```

---

## ✅ **Current System State (Clean)**

- **Livepeer Account**: `84ec8662-2528-4dcd-a7f1-fbcd0aa8af0a`
  - Assets: 0
  - Status: Active, ready for uploads

- **Database**: 
  - Videos: 0
  - Status: Clean, synced with Livepeer

- **Server**:
  - Environment: Fresh with new API key
  - Status: Running on port 3000

- **Public Pages**:
  - Homepage: Empty video grid (correct)
  - /videos: No videos listed (correct)
  - /streams: No streams listed (correct)

**Everything is synced. Ready for new uploads!** 🎉

---

## 🚀 **Next Steps**

1. **Upload Test Video**:
   - Go to http://localhost:3000/admin
   - Upload a small test video
   - Title: "Test Upload - New API"

2. **Verify in Livepeer**:
   ```bash
   npm run tsx scripts/verify-livepeer-account.ts
   ```
   Should show: 1 asset

3. **Verify in Database**:
   ```bash
   curl http://localhost:3000/api/videos
   ```
   Should show: 1 video

4. **Test Playback**:
   - Go to http://localhost:3000/
   - Click the video
   - Should play successfully

**If all 4 steps pass → Source of truth is working perfectly! ✅**

