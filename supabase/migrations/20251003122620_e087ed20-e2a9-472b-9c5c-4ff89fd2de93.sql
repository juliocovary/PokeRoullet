-- Add region columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN current_region text NOT NULL DEFAULT 'kanto',
ADD COLUMN unlocked_regions text[] NOT NULL DEFAULT ARRAY['kanto'];

-- Create index for better query performance
CREATE INDEX idx_profiles_current_region ON public.profiles(current_region);