-- Add admin_user_id column to streams table
-- This allows each admin user to have a single persistent stream

ALTER TABLE streams 
ADD COLUMN IF NOT EXISTS admin_user_id TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_streams_admin_user_id ON streams(admin_user_id);

-- Add updated_at column if it doesn't exist
ALTER TABLE streams 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create trigger to update updated_at
CREATE TRIGGER update_streams_updated_at
  BEFORE UPDATE ON streams
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

