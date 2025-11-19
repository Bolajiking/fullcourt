-- Add record_enabled flag to streams table so admins can toggle recording per session
ALTER TABLE streams
ADD COLUMN IF NOT EXISTS record_enabled BOOLEAN DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_streams_record_enabled ON streams(record_enabled);

