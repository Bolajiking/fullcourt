-- Row Level Security (RLS) Policies
-- Run this after creating the tables

-- Enable RLS on all tables
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_content_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Videos: Public read access, admin write access
CREATE POLICY "Videos are viewable by everyone" ON videos
  FOR SELECT USING (true);

CREATE POLICY "Only admins can insert videos" ON videos
  FOR INSERT WITH CHECK (false); -- Will be handled by service role key in API routes

CREATE POLICY "Only admins can update videos" ON videos
  FOR UPDATE USING (false); -- Will be handled by service role key in API routes

CREATE POLICY "Only admins can delete videos" ON videos
  FOR DELETE USING (false); -- Will be handled by service role key in API routes

-- Streams: Public read access, admin write access
CREATE POLICY "Streams are viewable by everyone" ON streams
  FOR SELECT USING (true);

CREATE POLICY "Only admins can insert streams" ON streams
  FOR INSERT WITH CHECK (false);

CREATE POLICY "Only admins can update streams" ON streams
  FOR UPDATE USING (false);

CREATE POLICY "Only admins can delete streams" ON streams
  FOR DELETE USING (false);

-- Products: Public read access, admin write access
CREATE POLICY "Products are viewable by everyone" ON products
  FOR SELECT USING (true);

CREATE POLICY "Only admins can insert products" ON products
  FOR INSERT WITH CHECK (false);

CREATE POLICY "Only admins can update products" ON products
  FOR UPDATE USING (false);

CREATE POLICY "Only admins can delete products" ON products
  FOR DELETE USING (false);

-- Orders: Users can only see their own orders, admins can see all
CREATE POLICY "Users can view their own orders" ON orders
  FOR SELECT USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can create their own orders" ON orders
  FOR INSERT WITH CHECK (auth.jwt() ->> 'sub' = user_id);

-- Note: Since we're using Privy for auth, we'll handle order access via API routes
-- The RLS policies above are placeholders. In practice, we'll use service role key
-- for admin operations and check user_id in application logic

-- User content access: Users can only see their own access records
CREATE POLICY "Users can view their own content access" ON user_content_access
  FOR SELECT USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can create their own content access" ON user_content_access
  FOR INSERT WITH CHECK (auth.jwt() ->> 'sub' = user_id);

-- User profiles: Users can view and update their own profile
CREATE POLICY "Users can view their own profile" ON user_profiles
  FOR SELECT USING (auth.jwt() ->> 'sub' = privy_user_id);

CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (auth.jwt() ->> 'sub' = privy_user_id);

CREATE POLICY "Users can insert their own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.jwt() ->> 'sub' = privy_user_id);

-- Note: Since Privy handles authentication separately, we'll primarily use
-- the service role key for database operations and verify user identity
-- in application code. These RLS policies provide an additional layer of security.

