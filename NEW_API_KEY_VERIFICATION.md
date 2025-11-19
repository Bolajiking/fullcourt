# New Livepeer API Key Verification

## ✅ Current Status

### Environment Configuration
- **API Key**: `84ec8662-2528-4dcd-a7f1-fbcd0aa8af0a`
- **Account Status**: Clean (0 assets)
- **Database**: Clean (0 videos)
- **Server**: Restarted with fresh environment variables

### What Was Done
1. ✅ Stopped dev server to clear old environment cache
2. ✅ Verified new Livepeer API key is configured in `.env.local`
3. ✅ Confirmed new Livepeer account has 0 assets (fresh account)
4. ✅ Database has 0 videos (cleaned earlier)
5. ✅ Restarted dev server with new environment variables

---

## 🧪 Verification Steps

### Step 1: Verify Server is Running
```bash
# Check if server is responding
curl http://localhost:3000/api/videos
```

**Expected**: `{"videos": []}`  
**Meaning**: Database is clean, ready for new uploads

### Step 2: Verify Livepeer Account
```bash
cd /Users/controlla/full-court
npm run tsx scripts/verify-livepeer-account.ts
```

**Expected Output**:
```
✅ No assets found in this Livepeer account
   This is expected for a fresh/new account
```

**Meaning**: You're connected to your NEW Livepeer account

### Step 3: Test Video Upload

1. **Open Admin Panel**: http://localhost:3000/admin
2. **Upload a Test Video**:
   - Select any video file
   - Enter title: "Test Upload"
   - Click "Upload Video"
3. **Watch Console Logs**:
   ```
   [Video Upload] Creating Livepeer asset...
   [Video Upload] Asset created: [new-asset-id]
   [Video Upload] Starting TUS upload...
   [Video Upload] Upload complete!
   ```

### Step 4: Verify Asset in Livepeer Dashboard

1. **Open Livepeer Dashboard**: https://livepeer.studio/dashboard
2. **Go to**: Assets
3. **Check**: You should see your test video
4. **Verify**: The asset ID matches the one from console logs

### Step 5: Verify Asset in Your Account
```bash
cd /Users/controlla/full-court
npm run tsx scripts/verify-livepeer-account.ts
```

**Expected**: Should now show 1 asset (your test video)

### Step 6: Verify Video in Database
```bash
curl http://localhost:3000/api/videos | python3 -m json.tool
```

**Expected**: Should show 1 video with the new asset ID

### Step 7: Test Video Playback

1. **Go to**: http://localhost:3000/
2. **See**: Your test video in the grid
3. **Click**: The video card
4. **Watch**: Video should load and play

---

## 🚨 Troubleshooting

### Issue: "New videos still go to old API"

**Check 1: Environment Variables**
```bash
cd /Users/controlla/full-court
cat .env.local | grep LIVEPEER
```

Should show:
```
LIVEPEER_API_KEY=84ec8662-2528-4dcd-a7f1-fbcd0aa8af0a
NEXT_PUBLIC_LIVEPEER_API_KEY=84ec8662-2528-4dcd-a7f1-fbcd0aa8af0a
```

**Check 2: Server Restart**

The dev server MUST be restarted after changing `.env.local`:
```bash
# Kill server
pkill -f "next dev"

# Start fresh
npm run dev
```

**Check 3: Verify Active Account**
```bash
npm run tsx scripts/verify-livepeer-account.ts
```

This shows which Livepeer account your API key connects to.

### Issue: "Uploads work but videos don't play"

**Cause**: Database has old asset IDs, but Livepeer has new assets.

**Fix**:
```bash
# Clear database
npm run tsx scripts/clear-old-videos.ts

# Re-upload videos via admin panel
```

### Issue: "Can't find uploaded videos"

**Check 1: Video Status**
```bash
curl http://localhost:3000/api/videos/debug | python3 -m json.tool
```

Check the `status` field:
- `"processing"` → Wait a few minutes for Livepeer to process
- `"ready"` → Should appear in app
- `"error"` → Upload failed, try again

**Check 2: Refresh Homepage**

Videos only appear when `status = "ready"`. Refresh after 1-2 minutes.

---

## 📋 Verification Checklist

Use this checklist to ensure everything is working:

- [ ] `.env.local` has the new API key (`84ec...`)
- [ ] Dev server was restarted after changing API key
- [ ] `verify-livepeer-account.ts` shows 0 or only new assets
- [ ] Database is clean (0 videos or only new videos)
- [ ] Can upload a test video via admin panel
- [ ] Uploaded video appears in Livepeer dashboard
- [ ] Uploaded video appears in database
- [ ] Uploaded video appears on homepage
- [ ] Uploaded video plays when clicked
- [ ] No console errors during upload or playback

---

## 🎯 Key Points

### Source of Truth

**Your new Livepeer account** (API key: `84ec...af0a`) is now the source of truth for:
- All video assets
- All livestreams
- All playback URLs

**Your Supabase database** stores:
- Video metadata (title, description, price)
- Reference to Livepeer asset ID
- User access permissions

**The Flow**:
```
User Uploads Video
    ↓
App creates asset in Livepeer (using API key from .env.local)
    ↓
Livepeer returns asset ID
    ↓
App saves asset ID to Supabase database
    ↓
When user plays video:
    ↓
App fetches asset ID from database
    ↓
App calls Livepeer API (using API key) to get playback URL
    ↓
Video plays
```

### Important Notes

1. **Always restart dev server** after changing `.env.local`
2. **Database and Livepeer must match** - if you change API keys, clear the database
3. **Only ONE Livepeer account** should be active at a time
4. **Test uploads** before assuming the old API is still being used

---

## 🔧 Useful Commands

### Check Current Configuration
```bash
# View API key
cat .env.local | grep LIVEPEER

# Verify Livepeer account
npm run tsx scripts/verify-livepeer-account.ts

# Check database
curl http://localhost:3000/api/videos
```

### Clean State
```bash
# Clear database
npm run tsx scripts/clear-old-videos.ts

# Restart server
pkill -f "next dev" && npm run dev
```

### Debug
```bash
# Check all videos with playback info
curl http://localhost:3000/api/videos/debug | python3 -m json.tool

# Test specific playback ID
curl "http://localhost:3000/api/videos/playback-url?playbackId=YOUR_PLAYBACK_ID"
```

---

## ✅ Success Criteria

Your system is correctly configured when:

1. **`verify-livepeer-account.ts`** shows only assets from your new account
2. **Database** contains only videos you uploaded after the API key change
3. **Test video upload** → appears in Livepeer dashboard with new account
4. **Test video upload** → appears in app and plays correctly
5. **No console errors** during upload or playback

---

**Status**: ✅ System is configured with new API key and ready for testing

**Next Action**: Upload a test video via http://localhost:3000/admin and verify it works end-to-end

