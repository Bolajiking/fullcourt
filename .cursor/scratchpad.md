     1|# Full Court Project Scratchpad
     2|
     3|## Background and Motivation
     4|
     5|Full Court is a premium basketball streaming platform where:
     6|- Livepeer powers VOD uploads and live streams (primary source of truth for playable media)
     7|- Supabase stores supplemental metadata, commerce data, and user information
     8|- Privy handles authentication and wallet-aware experiences
     9|
    10|**Current focus:** Ensure stable deployment and polish admin features.
    11|
    12|**Recently completed milestones**
    13|- ✅ All Phase 8 livestream enhancements (playback, error suppression, page organization)
    14|- ✅ Fast load times and clear content separation
    15|- ✅ Global error suppression for cleaner console logs
    16|- ✅ Phase 9: Admin Content Management (Delete/Edit capabilities)
    17|- ✅ UI Redesign (Sporty Aesthetic & Thumbnails)
    18|- ✅ Fix Vercel Deployment (Turbopack build errors resolved)
    19|
    20|**New priority**
    21|- **Launch:** Ensure Vercel deployment succeeds.
    22|
    23|## Key Challenges and Analysis
    24|
    25|- **Build System Issues:** Next.js 16 defaults to Turbopack, which was choking on `pino` and `thread-stream` test files included in dependencies. 
    26|  - **Fix:** Added `serverExternalPackages: ['pino', 'thread-stream', ...]` to `next.config.ts`. This prevents these server-side modules from being bundled, resolving the `Missing module type` errors.
    27|
    28|- **Dual-Write Consistency:** Deleting a video means deleting the Livepeer Asset ID + Supabase Row. If one fails, we might end up with orphaned data. We should try to delete both, or delete Livepeer first (since it costs money/storage) then Supabase.
    29|- **Recorded Sessions vs Uploaded Videos:** 
    30|  - Uploaded videos have a Supabase `videos` row.
    31|  - Recorded sessions might *only* exist as Livepeer Assets (if they weren't "saved" to Supabase, though our current flow tries to create records for everything? No, raw recordings don't have `videos` rows). 
    32|  - **Crucially:** If we want to manage "Recorded Sessions", we are essentially managing raw Livepeer Assets that don't have Supabase metadata.
    33|  - **Constraint:** The user wants to delete "livestream recorded sessions". These appear on `/streams`. They are just Assets in Livepeer.
    34|  - **Strategy:** We need an Admin UI that lists *all* assets (or specifically the ones identified as recordings) and allows deletion.
    35|- **Edit Functionality:** Only applies to things with metadata (Supabase records).
    36|- **Security:** All these endpoints must be strictly gated by `isAdmin` checks.
    37|
    38|## High-level Task Breakdown
    39|
    40|### Phase 9: Admin Content Management
    41|
    42|1. **Server-side Delete Utilities**
    43|   - **Goal:** Create functions to delete assets from Livepeer and rows from Supabase.
    44|   - **Success Criteria:** `deleteVideo(id)` deletes from both; `deleteAsset(livepeerId)` deletes from Livepeer.
    45|
    46|2. **Server-side Edit Utilities**
    47|   - **Goal:** Create functions to update Supabase video metadata.
    48|   - **Success Criteria:** `updateVideo(id, data)` updates Supabase row.
    49|
    50|3. **Admin Management UI**
    51|   - **Goal:** Create a "Manage Content" tab/section in the Admin Dashboard.
    52|   - **Success Criteria:**
    53|     - List of Uploaded Videos with Edit/Delete buttons.
    54|     - List of Recorded Sessions with Delete buttons.
    55|     - Edit modal/form for videos.
    56|     - Confirmation dialog for deletions.
    57|
    58|4. **API Routes**
    59|   - **Goal:** Secure endpoints for these actions.
    60|   - **Success Criteria:** 
    61|     - `DELETE /api/admin/assets/[id]`
    62|     - `PATCH /api/admin/videos/[id]`
    63|     - All checks `isAdmin`.
    64|
    65|## Project Status Board
    66|
    67|### Phase 1-9: Infrastructure, Features & Admin Management ✅ (Completed)
    68|- (See previous logs for details)
    69|
    70|### Phase 10: Polish & Launch (In Progress)
    71|- [x] Fix Vercel Build Errors
    72|- [ ] Final User Acceptance Testing
    73|- [ ] Deployment Pipeline Verification
    74|
    75|## Current Status / Progress Tracking
    76|
    77|**Current Task**: ✅ Fix Deployment & Push
    78|
    79|**Last Updated**: Fixed build configuration to exclude problematic node modules.
    80|
    81|**Status**: 
    82|- ✅ All Phase 9 tasks complete
    83|- ✅ Build errors resolved
    84|
    85|### Phase 9 Progress (COMPLETED)
    86|- ✅ Server-side delete utilities (Livepeer + Supabase)
    87|- ✅ Server-side edit utilities (Supabase)
    88|- ✅ Admin API endpoints (GET content, DELETE, PATCH)
    89|- ✅ Admin Dashboard UI for managing content
    90|- ✅ "Dual-write" consistency for deletions (Livepeer first, then DB)
    91|
    92|### Next Steps
    93|- Deploy to Vercel and verify functionality
    94|
    95|## Project Running Status
    96|
    97|- ✅ Development server started on http://localhost:3000
    98|- ✅ All pages and routes should be accessible
    99|- ✅ Authentication providers initialized (Privy, Livepeer)
   100|- ⚠️  Note: Make sure all environment variables are set in `.env.local`
   101|
   102|## Executor's Feedback or Assistance Requests
   103|
   104|- **✅ Vercel Build Fixed:**
   105|  - Updated `next.config.ts` with `serverExternalPackages` to handle `pino`/`thread-stream`.
   106|  - Verified local build (Turbopack) no longer fails on these files.
   107|