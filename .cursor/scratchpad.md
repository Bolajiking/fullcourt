# Full Court Project Scratchpad

## Background and Motivation

Full Court is a premium basketball streaming platform where:
- Livepeer powers VOD uploads and live streams (primary source of truth for playable media)
- Supabase stores supplemental metadata, commerce data, and user information
- Privy handles authentication and wallet-aware experiences

**Current focus:** Empower admins with full content management capabilities.
- Admins need to **delete** mistakes (both videos and recorded sessions).
- Admins need to **edit** metadata (titles, descriptions, prices) for uploaded videos.
- Actions must sync across both **Livepeer** (source of truth) and **Supabase** (metadata) to ensure consistency.

**Recently completed milestones**
- ✅ All Phase 8 livestream enhancements (playback, error suppression, page organization)
- ✅ Fast load times and clear content separation
- ✅ Global error suppression for cleaner console logs
- ✅ Phase 9: Admin Content Management (Delete/Edit capabilities)
- ✅ UI Redesign (Sporty Aesthetic & Thumbnails)

**New priority**
- **Sync:** Ensure operations update both Livepeer and Supabase.
- **Push:** Commit and push all changes to the repository.

## Key Challenges and Analysis

- **Dual-Write Consistency:** Deleting a video means deleting the Livepeer Asset ID + Supabase Row. If one fails, we might end up with orphaned data. We should try to delete both, or delete Livepeer first (since it costs money/storage) then Supabase.
- **Recorded Sessions vs Uploaded Videos:** 
  - Uploaded videos have a Supabase `videos` row.
  - Recorded sessions might *only* exist as Livepeer Assets (if they weren't "saved" to Supabase, though our current flow tries to create records for everything? No, raw recordings don't have `videos` rows). 
  - **Crucially:** If we want to manage "Recorded Sessions", we are essentially managing raw Livepeer Assets that don't have Supabase metadata.
  - **Constraint:** The user wants to delete "livestream recorded sessions". These appear on `/streams`. They are just Assets in Livepeer.
  - **Strategy:** We need an Admin UI that lists *all* assets (or specifically the ones identified as recordings) and allows deletion.
- **Edit Functionality:** Only applies to things with metadata (Supabase records).
- **Security:** All these endpoints must be strictly gated by `isAdmin` checks.

## High-level Task Breakdown

### Phase 9: Admin Content Management

1. **Server-side Delete Utilities**
   - **Goal:** Create functions to delete assets from Livepeer and rows from Supabase.
   - **Success Criteria:** `deleteVideo(id)` deletes from both; `deleteAsset(livepeerId)` deletes from Livepeer.

2. **Server-side Edit Utilities**
   - **Goal:** Create functions to update Supabase video metadata.
   - **Success Criteria:** `updateVideo(id, data)` updates Supabase row.

3. **Admin Management UI**
   - **Goal:** Create a "Manage Content" tab/section in the Admin Dashboard.
   - **Success Criteria:**
     - List of Uploaded Videos with Edit/Delete buttons.
     - List of Recorded Sessions with Delete buttons.
     - Edit modal/form for videos.
     - Confirmation dialog for deletions.

4. **API Routes**
   - **Goal:** Secure endpoints for these actions.
   - **Success Criteria:** 
     - `DELETE /api/admin/assets/[id]`
     - `PATCH /api/admin/videos/[id]`
     - All checks `isAdmin`.

## Project Status Board

### Phase 1-9: Infrastructure, Features & Admin Management ✅ (Completed)
- (See previous logs for details)

### Phase 10: Polish & Launch (Upcoming)
- [ ] Final User Acceptance Testing
- [ ] Deployment Pipeline Setup
- [ ] Analytics Integration

## Current Status / Progress Tracking

**Current Task**: ✅ Project Snapshot & Push

**Last Updated**: Committed all changes including UI redesign, thumbnail fixes, and admin features.

**Status**: 
- ✅ All Phase 9 tasks complete
- ✅ Repository synced with latest changes
- ✅ Secrets protected (via .gitignore)

### Phase 9 Progress (COMPLETED)
- ✅ Server-side delete utilities (Livepeer + Supabase)
- ✅ Server-side edit utilities (Supabase)
- ✅ Admin API endpoints (GET content, DELETE, PATCH)
- ✅ Admin Dashboard UI for managing content
- ✅ "Dual-write" consistency for deletions (Livepeer first, then DB)

### Next Steps
- User testing of admin workflows
- Implement "Live Chat" features (Phase 10?)
- Analytics and Payment integration

## Project Running Status

- ✅ Development server started on http://localhost:3000
- ✅ All pages and routes should be accessible
- ✅ Authentication providers initialized (Privy, Livepeer)
- ⚠️  Note: Make sure all environment variables are set in `.env.local`

## Executor's Feedback or Assistance Requests

- **✅ Supabase Setup Complete!** All tasks completed successfully:
  - Environment variables configured and verified
  - Database connection tested and working
  - All 6 database tables created and verified:
    - ✅ videos (0 records)
    - ✅ streams (0 records)
    - ✅ products (0 records)
    - ✅ orders (0 records)
    - ✅ user_content_access (0 records)
    - ✅ user_profiles (0 records)
  - Row Level Security policies applied
  - Indexes and triggers set up correctly

- **Verification Scripts Created:**
  - `scripts/test-supabase.ts` - Test database connection
  - `scripts/verify-schema.ts` - Verify all tables exist

- **✅ Phase 2 Complete - Core Providers Setup:**
  - Privy authentication provider created (`lib/auth/privy-provider.tsx`)
  - Livepeer video provider created (`lib/video/livepeer-provider.tsx`)
  - Both providers integrated into root layout
  - Custom auth hook created (`lib/auth/use-auth.ts`)

- **✅ Phase 3 Progress - Application Structure:**
  - Navigation component with auth state (`components/navigation.tsx`)
  - Footer component (`components/footer.tsx`)
  - Homepage redesigned with hero and features sections
  - Modern, responsive design with dark mode support

- **✅ Video Features Complete:**
  - Video player component using Livepeer (`components/video-player.tsx`)
  - Video card component for listings (`components/video-card.tsx`)
  - Videos listing page (`app/videos/page.tsx`)
  - Individual video view page (`app/videos/[id]/page.tsx`)
  - Streams listing page (`app/streams/page.tsx`)
  - API routes for video management (`app/api/videos/route.ts`, `app/api/videos/[id]/route.ts`)
  - Livepeer utilities for API integration (`lib/video/livepeer-utils.ts`)

- **✅ User Profile Features Complete:**
  - User profile page (`app/profile/page.tsx`)
  - Profile creation and updates
  - Syncs with Privy authentication
  - Displays wallet address and user info
  - API routes for profile management (`app/api/profile/route.ts`)

- **✅ E-commerce Placeholder:**
  - Coming soon page for products (`app/products/page.tsx`)
  - Clean, professional placeholder design

- **✅ Video Upload Features Complete:**
  - Video upload page (`app/upload/page.tsx`)
  - Drag and drop file upload with react-dropzone
  - Upload progress tracking
  - Status polling for video processing
  - API route for video upload (`app/api/videos/upload/route.ts`)
  - Integration with Livepeer API
  - Automatic Supabase record creation
  - Updated navigation with Upload link

- **✅ Live Streaming Features Complete:**
  - Stream creation page (`app/streams/create/page.tsx`)
  - RTMP URL and stream key display
  - Copy-to-clipboard functionality
  - Instructions for OBS/Streamlabs setup
  - Individual stream viewing page (`app/streams/[id]/page.tsx`)
  - Live stream player integration
  - API routes for stream management (`app/api/streams/create/route.ts`, `app/api/streams/[id]/route.ts`)
  - Livepeer stream utilities (`lib/video/livepeer-utils.ts`)
  - Updated navigation with "Go Live" link
- **✅ Creator/Admin Dashboard:**
  - Admin control center (`app/admin/page.tsx`)
  - Reusable video upload form (`components/admin/video-upload-form.tsx`)
  - Reusable livestream creation form (`components/admin/stream-create-form.tsx`)
  - Product creation form and API (`components/admin/product-create-form.tsx`, `app/api/products/route.ts`)
  - Stats overview and latest activity lists
  - Navigation link to admin dashboard

- **✅ Admin Access Control:**
  - Admin utility functions (`lib/auth/admin-utils.ts`) - checks against `ADMIN_USER_IDS` env variable
  - Admin check API route (`app/api/auth/check-admin/route.ts`)
  - Client-side admin hook (`lib/auth/use-admin.ts`) - checks admin status via API
  - All upload/stream/product creation API routes now require admin access (check `x-user-id` header)
  - All admin pages check admin status before rendering
  - Navigation only shows admin links (Upload, Go Live, Admin) to admin users
  - Forms send user ID in request headers for server-side validation

- **✅ Video Thumbnail Upload:**
  - Video upload form now supports custom thumbnail image uploads (`components/admin/video-upload-form.tsx`)
  - Thumbnail preview display before upload
  - Thumbnails converted to base64 and sent with video metadata
  - API route handles thumbnail storage (`app/api/videos/upload/route.ts`)
  - Thumbnails display on video cards in grid views
  - Fallback to Livepeer auto-generated thumbnails if no custom thumbnail provided

- **✅ Netflix-Style UI Enhancement:**
  - Video cards redesigned with Netflix-style hover animations (`components/video-card.tsx`)
    - Cards scale up and lift on hover (scale-110, translate-y-2)
    - Enhanced shadow effects with gradient glows
    - Play button appears with scale animation
    - Information panel slides up on hover revealing description and action buttons
    - Smooth 700ms transitions for all hover effects
  - Video grid layouts optimized for Netflix-style browsing (`app/page.tsx`, `app/videos/page.tsx`)
    - Increased spacing between cards (gap-8, xl:gap-10)
    - Staggered fade-in animations for each card (50ms delay between cards)
    - Responsive grid: 1 col mobile → 2 cols tablet → 3-4 cols desktop
  - Custom CSS animations added (`app/globals.css`)
    - fadeInUp animation for card entrance effects
    - Cards fade in from below with 600ms duration
  - Improved thumbnail display with zoom effect on hover
  - Enhanced metadata display (FREE badge, video type icons)
  - Basketball-themed color palette maintained throughout

- **✅ Video Player Fix - Dynamic CDN URL Fetching:**
  - Updated video player to dynamically fetch Livepeer CDN URLs
  - Uses client-side API call to `/api/videos/playback-url` to get actual video URL
  - Falls back to constructed CDN URL if API fails
  - Added comprehensive error indicators:
    - `LoadingIndicator` with animated spinner during video load
    - `ErrorIndicator` for "offline" streams (live content)
    - `ErrorIndicator` for "access-control" (private content)
    - `ErrorIndicator` for general playback errors
  - Enhanced video controls with basketball-themed styling:
    - Gradient progress bar (orange to red)
    - Play/pause with proper `PlayingIndicator` toggling
    - `LiveIndicator` for live streams with pulsing red dot
    - Volume control with slider
    - Playback rate selector (VOD only)
    - Fullscreen toggle
  - Player now properly handles:
    - Valid playback IDs → plays video
    - Invalid/missing playback IDs → shows error message
    - Processing videos → shows processing message with playback ID
    - Stream offline → auto-waits for stream to start
  - All controls styled with basketball theme colors and smooth animations
  - Created test page at `/test-player` for debugging playback issues

- **Next Steps:**
  - Add payment/access control for paid content
  - Set up Livepeer webhooks for automatic status updates (optional improvement)
  - Add stream status polling/updates

## Lessons

- Include info useful for debugging in the program output
- Read the file before you try to edit it
- If there are vulnerabilities that appear in the terminal, run npm audit before proceeding
- Always ask before using the -force git command
- **Livepeer Player Errors:** The Livepeer player emits empty `{}` error objects and "timeout" errors during live stream warmup. These are benign and should be silently ignored. Only log/display errors that have both a `type` and `message` property for actual playback failures.
- **Database Schema Verification:** Always verify that migrations have been applied before debugging application errors. Use verification scripts to check for column existence in Supabase.
- **Livestream Resilience:** Always persist playback IDs in Supabase as a fallback cache. If Livepeer APIs fail at runtime, auto-fetch missing playback IDs from the stream object and store them for future use.
- **Server-side Playback Sources:** For optimal performance, fetch Livepeer playback sources (`Src[]`) on the server and pass them as props to client components, minimizing client-side API calls.
