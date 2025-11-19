-- Remove UNIQUE constraint from livepeer_stream_id in streams table
-- This allows multiple stream sessions (Supabase records) to share the same Livepeer stream ID
-- which enables the "persistent stream key" workflow where admins broadcast to one endpoint
-- but create multiple "events" with different titles/descriptions.

ALTER TABLE streams 
DROP CONSTRAINT IF EXISTS streams_livepeer_stream_id_key;

-- Also ensure we don't have any other unique index on this column
DROP INDEX IF EXISTS streams_livepeer_stream_id_key;

