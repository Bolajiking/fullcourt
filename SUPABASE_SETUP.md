# Supabase Setup Guide

Follow these steps to set up your Supabase database:

## Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in to your account
3. Click **"New Project"** button
4. Fill in the project details:
   - **Name**: `full-court` (or your preferred name)
   - **Database Password**: Choose a strong password (save this - you'll need it!)
   - **Region**: Choose the region closest to your users
   - **Pricing Plan**: Free tier is fine for development
5. Click **"Create new project"**
6. Wait 2-3 minutes for the project to be provisioned

## Step 2: Get Your Credentials

Once your project is ready:

1. In your Supabase dashboard, go to **Settings** (gear icon in sidebar)
2. Click on **API** in the settings menu
3. You'll see three important values:

   **Project URL**
   - Copy this value
   - Example: `https://abcdefghijklmnop.supabase.co`
   - This goes in `NEXT_PUBLIC_SUPABASE_URL`

   **anon public key**
   - Copy this value (it's the "anon" or "public" key)
   - This is a long string starting with `eyJ...`
   - This goes in `NEXT_PUBLIC_SUPABASE_ANON_KEY`

   **service_role key**
   - ⚠️ **IMPORTANT**: This key bypasses Row Level Security
   - Click "Reveal" to show it
   - Copy this value
   - This goes in `SUPABASE_SERVICE_ROLE_KEY`
   - **Keep this secret!** Never commit it to git.

## Step 3: Run Database Migrations

1. In your Supabase dashboard, go to **SQL Editor** (in the sidebar)
2. Click **"New query"**

### Migration 1: Initial Schema

1. Open the file: `supabase/migrations/001_initial_schema.sql`
2. Copy the entire contents
3. Paste into the SQL Editor
4. Click **"Run"** (or press Cmd/Ctrl + Enter)
5. You should see "Success. No rows returned"

### Migration 2: Row Level Security

1. Open the file: `supabase/migrations/002_row_level_security.sql`
2. Copy the entire contents
3. Paste into the SQL Editor
4. Click **"Run"**
5. You should see "Success. No rows returned"

## Step 4: Verify Tables Created

1. Go to **Table Editor** in the sidebar
2. You should see these tables:
   - ✅ videos
   - ✅ streams
   - ✅ products
   - ✅ orders
   - ✅ user_content_access
   - ✅ user_profiles

## Step 5: Update Environment Variables

Once you have your credentials, provide them to update `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL` = Your Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = Your anon public key
- `SUPABASE_SERVICE_ROLE_KEY` = Your service_role key

## Step 6: Test Connection

After updating `.env.local`, you can test the connection:

1. Start the dev server: `npm run dev`
2. Visit: `http://localhost:3000/api/test/db`
3. You should see: `{"success":true,"message":"Database connection successful",...}`

---

**Need Help?** If you encounter any issues, check the Supabase documentation or the error messages in the SQL Editor.

