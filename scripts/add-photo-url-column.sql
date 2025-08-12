-- Migration: Add photo_url column to personnel table
-- Run this in your Supabase SQL Editor if you already have a personnel table without photo_url

-- Add photo_url column to personnel table (if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'personnel' 
        AND column_name = 'photo_url'
    ) THEN
        ALTER TABLE personnel ADD COLUMN photo_url TEXT;
        
        -- Add comment for documentation
        COMMENT ON COLUMN personnel.photo_url IS 'UploadThing CDN URL for personnel photos';
        
        RAISE NOTICE 'Added photo_url column to personnel table';
    ELSE
        RAISE NOTICE 'photo_url column already exists in personnel table';
    END IF;
END $$;

-- Add photo_url column to profiles table (if it doesn't exist) for user avatars
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'avatar_url'
    ) THEN
        ALTER TABLE profiles ADD COLUMN avatar_url TEXT;
        
        -- Add comment for documentation
        COMMENT ON COLUMN profiles.avatar_url IS 'UploadThing CDN URL for user profile photos';
        
        RAISE NOTICE 'Added avatar_url column to profiles table';
    ELSE
        RAISE NOTICE 'avatar_url column already exists in profiles table';
    END IF;
END $$;
