-- Add app store URL columns to site_settings table
ALTER TABLE site_settings
ADD COLUMN IF NOT EXISTS play_store_url TEXT,
ADD COLUMN IF NOT EXISTS app_store_url TEXT,
ADD COLUMN IF NOT EXISTS play_store_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS app_store_enabled BOOLEAN DEFAULT false;
