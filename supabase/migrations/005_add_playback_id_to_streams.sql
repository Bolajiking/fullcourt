-- Add playback_id column to streams table so we can persist the Livepeer playback ID
-- This allows public pages to render livestreams even if Livepeer APIs are temporarily unavailable.

ALTER TABLE streams
ADD COLUMN IF NOT EXISTS playback_id TEXT;

CREATE INDEX IF NOT EXISTS idx_streams_playback_id ON streams(playback_id);

