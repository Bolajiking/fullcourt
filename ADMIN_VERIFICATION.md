# Admin Features Verification Guide

## ✅ Admin Authentication System

### Configuration
- **Environment Variable**: `ADMIN_USER_IDS` in `.env.local`
- **Format**: Comma-separated list of Privy user IDs
- **Example**: `ADMIN_USER_IDS=cmi4ea4zw00nxl80ciu9rkaru,another_admin_id`

### Components

#### 1. Server-Side Admin Check (`lib/auth/admin-utils.ts`)
- `isAdmin(userId: string)` - Checks if a user ID is in the admin list
- `getAdminUserIds()` - Returns all admin user IDs
- Uses `serverEnv.adminUserIds` from environment variables

#### 2. Client-Side Admin Hook (`lib/auth/use-admin.ts`)
- `useAdmin()` - React hook that checks admin status via API
- Returns `{ isAdmin: boolean, loading: boolean }`
- Calls `/api/auth/check-admin?user_id=...` endpoint

#### 3. Admin Check API (`app/api/auth/check-admin/route.ts`)
- `GET /api/auth/check-admin?user_id=...`
- Returns `{ isAdmin: boolean }`
- Uses server-side `isAdmin()` function

### Protected API Routes

All these routes require admin access (check `x-user-id` header):

1. **Video Upload** (`POST /api/videos/upload`)
   - Requires admin to upload videos
   - Checks `x-user-id` header

2. **Stream Creation** (`POST /api/streams/create`)
   - Requires admin to create live streams
   - Checks `x-user-id` header

3. **Product Creation** (`POST /api/products`)
   - Requires admin to add products
   - Checks `x-user-id` header

### Protected Pages

All these pages check admin status before rendering:

1. **Admin Dashboard** (`/admin`)
   - Shows "Access Denied" for non-admins
   - Uses `useAdmin()` hook

2. **Video Upload** (`/upload`)
   - Shows "Access Denied" for non-admins
   - Uses `useAdmin()` hook

3. **Stream Creation** (`/streams/create`)
   - Shows "Access Denied" for non-admins
   - Uses `useAdmin()` hook

### Navigation

- **Admin Links**: Only visible to admin users
  - "Upload" link
  - "Go Live" link
  - "Admin" link
- Uses `useAdmin()` hook to conditionally render

### Forms

All admin forms send user ID in request headers:

1. **VideoUploadForm** (`components/admin/video-upload-form.tsx`)
   - Sends `x-user-id` header with `userId` from `useAuth()`

2. **StreamCreateForm** (`components/admin/stream-create-form.tsx`)
   - Sends `x-user-id` header with `userId` from `useAuth()`

3. **ProductCreateForm** (`components/admin/product-create-form.tsx`)
   - Sends `x-user-id` header with `userId` from `useAuth()`

## Testing Admin Features

### 1. Test Admin Check API
```bash
curl "http://localhost:3000/api/auth/check-admin?user_id=YOUR_ADMIN_USER_ID"
# Should return: {"isAdmin":true}
```

### 2. Test Admin Script
```bash
npx tsx scripts/test-admin.ts
```

### 3. Manual Testing Checklist

- [ ] Sign in with admin user ID
- [ ] Verify admin links appear in navigation (Upload, Go Live, Admin)
- [ ] Access `/admin` page - should show dashboard
- [ ] Access `/upload` page - should show upload form
- [ ] Access `/streams/create` page - should show stream creation form
- [ ] Upload a video - should succeed
- [ ] Create a stream - should succeed
- [ ] Add a product - should succeed
- [ ] Sign in with non-admin user
- [ ] Verify admin links do NOT appear in navigation
- [ ] Access `/admin` page - should show "Access Denied"
- [ ] Access `/upload` page - should show "Access Denied"
- [ ] Access `/streams/create` page - should show "Access Denied"
- [ ] Try to upload video via API - should return 403
- [ ] Try to create stream via API - should return 403
- [ ] Try to add product via API - should return 403

## Security Notes

1. **Server-Side Validation**: All API routes validate admin status server-side
2. **Client-Side UI**: Client-side checks are for UX only, not security
3. **Environment Variables**: Admin user IDs are server-side only (not exposed to client)
4. **RLS Policies**: Database RLS policies prevent non-admin writes (handled by service role key in API routes)

## Troubleshooting

### Admin check returns false
- Verify `ADMIN_USER_IDS` is set in `.env.local`
- Check that user ID matches exactly (no extra spaces)
- Restart dev server after changing `.env.local`

### Admin links not showing
- Check browser console for errors
- Verify `useAdmin()` hook is working
- Check network tab for `/api/auth/check-admin` request

### API routes return 403
- Verify `x-user-id` header is being sent
- Check that user ID is in `ADMIN_USER_IDS`
- Verify server-side `isAdmin()` function is working

