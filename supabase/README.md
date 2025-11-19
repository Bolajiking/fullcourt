# Supabase Database Setup

This directory contains database migrations and setup instructions for the Full Court platform.

## Setup Instructions

### 1. Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in project details:
   - Name: `full-court` (or your preferred name)
   - Database Password: (choose a strong password)
   - Region: (choose closest to your users)
5. Wait for project to be created (takes ~2 minutes)

### 2. Get Your Supabase Credentials

1. Go to Project Settings → API
2. Copy the following values:
   - **Project URL** → Use for `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → Use for `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → Use for `SUPABASE_SERVICE_ROLE_KEY` (keep this secret!)

### 3. Update Environment Variables

Update your `.env.local` file with the Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 4. Run Database Migrations

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Run the migrations in order:

#### Migration 1: Initial Schema
- Open `supabase/migrations/001_initial_schema.sql`
- Copy and paste the entire contents into the SQL Editor
- Click "Run" to execute

#### Migration 2: Row Level Security
- Open `supabase/migrations/002_row_level_security.sql`
- Copy and paste the entire contents into the SQL Editor
- Click "Run" to execute

### 5. Verify Tables Created

1. Go to **Table Editor** in your Supabase dashboard
2. You should see the following tables:
   - `videos`
   - `streams`
   - `products`
   - `orders`
   - `user_content_access`
   - `user_profiles`

### 6. Test Connection

The Supabase client is already configured in `lib/supabase/client.ts` and `lib/supabase/server.ts`. 

To test the connection, you can create a simple API route or component that queries the database.

## Database Schema Overview

### Tables

- **videos**: Stores VOD (Video on Demand) content metadata
- **streams**: Stores live stream metadata and RTMP configuration
- **products**: E-commerce product catalog
- **orders**: Customer orders for products
- **user_content_access**: Tracks which users have paid access to which content
- **user_profiles**: User profile information linked to Privy user IDs

### Security

- Row Level Security (RLS) is enabled on all tables
- Public read access for videos, streams, and products
- Users can only access their own orders and content access records
- Admin operations use the service role key (bypasses RLS)

## Notes

- Since we're using Privy for authentication (not Supabase Auth), the RLS policies that check `auth.jwt()` won't work directly. We handle access control in application code by checking the Privy user ID.
- The service role key should only be used in server-side code (API routes, server components) and never exposed to the client.
- All timestamps are stored in UTC with timezone information.

