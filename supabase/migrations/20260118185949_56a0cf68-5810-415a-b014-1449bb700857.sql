-- Create trainer_rankings table for Trainer Mode rankings
CREATE TABLE public.trainer_rankings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  nickname TEXT NOT NULL,
  avatar TEXT,
  highest_stage INTEGER NOT NULL DEFAULT 0,
  highest_stage_rank INTEGER,
  total_pokemon_defeated INTEGER NOT NULL DEFAULT 0,
  defeated_rank INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create unique constraint on user_id
ALTER TABLE public.trainer_rankings 
ADD CONSTRAINT trainer_rankings_user_id_key UNIQUE (user_id);

-- Enable Row Level Security
ALTER TABLE public.trainer_rankings ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Trainer rankings are public" 
ON public.trainer_rankings 
FOR SELECT 
USING (true);

-- Create indexes for faster queries
CREATE INDEX idx_trainer_rankings_highest_stage ON public.trainer_rankings (highest_stage DESC);
CREATE INDEX idx_trainer_rankings_defeated ON public.trainer_rankings (total_pokemon_defeated DESC);
CREATE INDEX idx_trainer_rankings_stage_rank ON public.trainer_rankings (highest_stage_rank ASC) WHERE highest_stage_rank IS NOT NULL;
CREATE INDEX idx_trainer_rankings_defeated_rank ON public.trainer_rankings (defeated_rank ASC) WHERE defeated_rank IS NOT NULL;