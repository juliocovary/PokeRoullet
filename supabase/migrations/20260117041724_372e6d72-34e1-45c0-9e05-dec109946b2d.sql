-- Add auto_battle purchase flag to trainer_progress
ALTER TABLE trainer_progress 
ADD COLUMN IF NOT EXISTS has_auto_battle boolean DEFAULT false;