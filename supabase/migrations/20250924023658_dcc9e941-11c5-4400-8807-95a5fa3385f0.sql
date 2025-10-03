-- Add base_free_spins column to user_spins table
ALTER TABLE public.user_spins ADD COLUMN base_free_spins integer NOT NULL DEFAULT 5;

-- Update existing users to have base_free_spins = 5
UPDATE public.user_spins SET base_free_spins = 5 WHERE base_free_spins IS NULL;