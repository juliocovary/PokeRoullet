
-- Add pokegems column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pokegems integer NOT NULL DEFAULT 0;

-- Create trainer_pokemon table (Pokemon owned in trainer mode)
CREATE TABLE public.trainer_pokemon (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  pokemon_id integer NOT NULL,
  pokemon_name text NOT NULL,
  pokemon_type text NOT NULL,
  secondary_type text,
  star_rating integer NOT NULL CHECK (star_rating >= 1 AND star_rating <= 6),
  level integer NOT NULL DEFAULT 1,
  experience integer NOT NULL DEFAULT 0,
  power integer NOT NULL DEFAULT 100,
  stat_damage text NOT NULL DEFAULT 'D' CHECK (stat_damage IN ('D', 'C', 'B', 'A', 'S')),
  stat_speed text NOT NULL DEFAULT 'D' CHECK (stat_speed IN ('D', 'C', 'B', 'A', 'S')),
  stat_effect text NOT NULL DEFAULT 'D' CHECK (stat_effect IN ('D', 'C', 'B', 'A', 'S')),
  is_evolved boolean NOT NULL DEFAULT false,
  evolved_from text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create trainer_teams table (active team slots)
CREATE TABLE public.trainer_teams (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  slot_1_pokemon_id uuid REFERENCES public.trainer_pokemon(id) ON DELETE SET NULL,
  slot_2_pokemon_id uuid REFERENCES public.trainer_pokemon(id) ON DELETE SET NULL,
  slot_3_pokemon_id uuid REFERENCES public.trainer_pokemon(id) ON DELETE SET NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create trainer_progress table (stage progression)
CREATE TABLE public.trainer_progress (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  current_stage integer NOT NULL DEFAULT 1,
  current_wave integer NOT NULL DEFAULT 1,
  highest_stage_cleared integer NOT NULL DEFAULT 0,
  total_battles_won integer NOT NULL DEFAULT 0,
  total_pokemon_defeated integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create banner_config table (rotating banner configuration)
CREATE TABLE public.banner_config (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rotation_interval_minutes integer NOT NULL DEFAULT 30,
  current_rotation_start timestamp with time zone NOT NULL DEFAULT now(),
  slot_1_pokemon jsonb NOT NULL,
  slot_2_pokemon jsonb NOT NULL,
  slot_3_pokemon jsonb NOT NULL,
  slot_4_pokemon jsonb NOT NULL,
  slot_5_pokemon jsonb NOT NULL,
  slot_6_pokemon jsonb NOT NULL,
  slot_7_pokemon jsonb NOT NULL,
  slot_8_pokemon jsonb NOT NULL,
  slot_9_pokemon jsonb NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create banner_history table (summon history)
CREATE TABLE public.banner_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  pokemon_obtained text NOT NULL,
  pokemon_id integer NOT NULL,
  star_rating integer NOT NULL,
  stat_damage text NOT NULL,
  stat_speed text NOT NULL,
  stat_effect text NOT NULL,
  cost_type text NOT NULL DEFAULT 'pokecoins',
  cost_amount integer NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create stage_config table (enemy configuration per stage)
CREATE TABLE public.stage_config (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stage_number integer NOT NULL,
  wave_number integer NOT NULL,
  pokemon_id integer NOT NULL,
  pokemon_name text NOT NULL,
  pokemon_type text NOT NULL,
  base_hp integer NOT NULL,
  base_damage integer NOT NULL,
  is_boss boolean NOT NULL DEFAULT false,
  is_mini_boss boolean NOT NULL DEFAULT false,
  is_challenger boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(stage_number, wave_number, pokemon_id)
);

-- Enable RLS on all tables
ALTER TABLE public.trainer_pokemon ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trainer_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trainer_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banner_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banner_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stage_config ENABLE ROW LEVEL SECURITY;

-- RLS Policies for trainer_pokemon
CREATE POLICY "Users can view their own trainer pokemon"
ON public.trainer_pokemon FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own trainer pokemon"
ON public.trainer_pokemon FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own trainer pokemon"
ON public.trainer_pokemon FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own trainer pokemon"
ON public.trainer_pokemon FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for trainer_teams
CREATE POLICY "Users can view their own team"
ON public.trainer_teams FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own team"
ON public.trainer_teams FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own team"
ON public.trainer_teams FOR UPDATE
USING (auth.uid() = user_id);

-- RLS Policies for trainer_progress
CREATE POLICY "Users can view their own progress"
ON public.trainer_progress FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress"
ON public.trainer_progress FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress"
ON public.trainer_progress FOR UPDATE
USING (auth.uid() = user_id);

-- RLS Policies for banner_config (public read)
CREATE POLICY "Banner config is viewable by everyone"
ON public.banner_config FOR SELECT
USING (true);

-- RLS Policies for banner_history
CREATE POLICY "Users can view their own banner history"
ON public.banner_history FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own banner history"
ON public.banner_history FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for stage_config (public read)
CREATE POLICY "Stage config is viewable by everyone"
ON public.stage_config FOR SELECT
USING (true);

-- Create indexes for performance
CREATE INDEX idx_trainer_pokemon_user_id ON public.trainer_pokemon(user_id);
CREATE INDEX idx_trainer_pokemon_star_rating ON public.trainer_pokemon(star_rating);
CREATE INDEX idx_banner_history_user_id ON public.banner_history(user_id);
CREATE INDEX idx_stage_config_stage ON public.stage_config(stage_number, wave_number);

-- Create trigger for updating timestamps
CREATE TRIGGER update_trainer_pokemon_updated_at
BEFORE UPDATE ON public.trainer_pokemon
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_trainer_teams_updated_at
BEFORE UPDATE ON public.trainer_teams
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_trainer_progress_updated_at
BEFORE UPDATE ON public.trainer_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_banner_config_updated_at
BEFORE UPDATE ON public.banner_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
