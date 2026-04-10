-- Add pokeshards to profiles table
ALTER TABLE public.profiles ADD COLUMN pokeshards integer NOT NULL DEFAULT 0;

-- Create missions table
CREATE TABLE public.missions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL,
  type text NOT NULL CHECK (type IN ('daily', 'weekly')),
  category text NOT NULL,
  goal integer NOT NULL,
  reward_coins integer NOT NULL DEFAULT 0,
  reward_xp integer NOT NULL DEFAULT 0,
  reward_shards integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on missions table
ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;

-- Create policy for missions (read-only for users)
CREATE POLICY "Missions are viewable by everyone" 
ON public.missions 
FOR SELECT 
USING (true);

-- Create user_missions table
CREATE TABLE public.user_missions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  mission_id uuid NOT NULL REFERENCES public.missions(id),
  progress integer NOT NULL DEFAULT 0,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamp with time zone,
  last_reset timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, mission_id)
);

-- Enable RLS on user_missions table
ALTER TABLE public.user_missions ENABLE ROW LEVEL SECURITY;

-- Create policies for user_missions
CREATE POLICY "Users can view their own missions" 
ON public.user_missions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own missions" 
ON public.user_missions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own missions" 
ON public.user_missions 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create trigger for updating updated_at on user_missions
CREATE TRIGGER update_user_missions_updated_at
BEFORE UPDATE ON public.user_missions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default missions
INSERT INTO public.missions (title, description, type, category, goal, reward_coins, reward_xp, reward_shards) VALUES
-- Daily missions
('Gire a Roleta', 'Gire a roleta 15 vezes', 'daily', 'spin', 15, 10, 50, 0),
('Venda Cards', 'Venda 3 cards de qualquer raridade', 'daily', 'sell', 3, 5, 25, 0),
('Encontre um Raro', 'Capture 1 Pokémon raro ou superior', 'daily', 'catch_rare', 1, 5, 30, 0),

-- Weekly missions
('Mestre da Roleta', 'Gire a roleta 100 vezes', 'weekly', 'spin', 100, 25, 150, 15),
('Comerciante Experiente', 'Venda 20 cards', 'weekly', 'sell', 20, 20, 75, 5),
('Caçador de Raros', 'Capture 10 Pokémon raros ou superiores', 'weekly', 'catch_rare', 10, 15, 80, 10);

-- Create function to update mission progress
CREATE OR REPLACE FUNCTION public.update_mission_progress(
  p_user_id uuid,
  p_category text,
  p_increment integer DEFAULT 1
)
RETURNS TABLE(
  missions_completed json,
  rewards_earned json
) AS $$
DECLARE
  mission_record RECORD;
  completed_missions json := '[]'::json;
  total_rewards json := '{"coins": 0, "xp": 0, "shards": 0}'::json;
  daily_completed_count integer := 0;
  weekly_completed_count integer := 0;
  daily_total_count integer := 0;
  weekly_total_count integer := 0;
BEGIN
  -- Get all missions for this category
  FOR mission_record IN 
    SELECT m.*, COALESCE(um.progress, 0) as current_progress, um.completed
    FROM public.missions m
    LEFT JOIN public.user_missions um ON (m.id = um.mission_id AND um.user_id = p_user_id)
    WHERE m.category = p_category
  LOOP
    -- Initialize user mission if not exists
    INSERT INTO public.user_missions (user_id, mission_id, progress)
    VALUES (p_user_id, mission_record.id, 0)
    ON CONFLICT (user_id, mission_id) DO NOTHING;
    
    -- Update progress if not completed
    IF NOT COALESCE(mission_record.completed, false) THEN
      UPDATE public.user_missions 
      SET progress = LEAST(progress + p_increment, mission_record.goal),
          updated_at = now()
      WHERE user_id = p_user_id AND mission_id = mission_record.id;
      
      -- Check if mission is now completed
      IF (mission_record.current_progress + p_increment) >= mission_record.goal THEN
        UPDATE public.user_missions 
        SET completed = true, completed_at = now()
        WHERE user_id = p_user_id AND mission_id = mission_record.id;
        
        -- Add to completed missions
        completed_missions := completed_missions || json_build_object(
          'id', mission_record.id,
          'title', mission_record.title,
          'type', mission_record.type,
          'reward_coins', mission_record.reward_coins,
          'reward_xp', mission_record.reward_xp,
          'reward_shards', mission_record.reward_shards
        );
        
        -- Add to total rewards
        total_rewards := json_build_object(
          'coins', (total_rewards->>'coins')::integer + mission_record.reward_coins,
          'xp', (total_rewards->>'xp')::integer + mission_record.reward_xp,
          'shards', (total_rewards->>'shards')::integer + mission_record.reward_shards
        );
      END IF;
    END IF;
  END LOOP;
  
  -- Count completed missions by type
  SELECT COUNT(*) INTO daily_completed_count
  FROM public.user_missions um
  JOIN public.missions m ON m.id = um.mission_id
  WHERE um.user_id = p_user_id AND um.completed = true AND m.type = 'daily';
  
  SELECT COUNT(*) INTO weekly_completed_count
  FROM public.user_missions um
  JOIN public.missions m ON m.id = um.mission_id
  WHERE um.user_id = p_user_id AND um.completed = true AND m.type = 'weekly';
  
  SELECT COUNT(*) INTO daily_total_count
  FROM public.missions WHERE type = 'daily';
  
  SELECT COUNT(*) INTO weekly_total_count
  FROM public.missions WHERE type = 'weekly';
  
  -- Check for daily completion bonus
  IF daily_completed_count = daily_total_count THEN
    -- Check if bonus already claimed today
    IF NOT EXISTS (
      SELECT 1 FROM public.user_missions um
      JOIN public.missions m ON m.id = um.mission_id
      WHERE um.user_id = p_user_id 
        AND m.type = 'daily' 
        AND um.completed = true
        AND DATE(um.completed_at) = CURRENT_DATE
        AND um.bonus_claimed = true
    ) THEN
      -- Add daily completion bonus
      total_rewards := json_build_object(
        'coins', (total_rewards->>'coins')::integer + 15,
        'xp', (total_rewards->>'xp')::integer + 100,
        'shards', (total_rewards->>'shards')::integer + 15
      );
      
      -- Mark bonus as claimed
      ALTER TABLE public.user_missions ADD COLUMN IF NOT EXISTS bonus_claimed boolean DEFAULT false;
      UPDATE public.user_missions 
      SET bonus_claimed = true
      FROM public.missions m
      WHERE user_missions.mission_id = m.id 
        AND user_missions.user_id = p_user_id 
        AND m.type = 'daily';
    END IF;
  END IF;
  
  -- Check for weekly completion bonus
  IF weekly_completed_count = weekly_total_count THEN
    -- Similar logic for weekly bonus
    IF NOT EXISTS (
      SELECT 1 FROM public.user_missions um
      JOIN public.missions m ON m.id = um.mission_id
      WHERE um.user_id = p_user_id 
        AND m.type = 'weekly' 
        AND um.completed = true
        AND DATE(um.completed_at) >= CURRENT_DATE - INTERVAL '7 days'
        AND um.bonus_claimed = true
    ) THEN
      total_rewards := json_build_object(
        'coins', (total_rewards->>'coins')::integer + 75,
        'xp', (total_rewards->>'xp')::integer + 250,
        'shards', (total_rewards->>'shards')::integer + 50
      );
    END IF;
  END IF;
  
  -- Apply rewards to user profile
  IF (total_rewards->>'coins')::integer > 0 OR (total_rewards->>'xp')::integer > 0 OR (total_rewards->>'shards')::integer > 0 THEN
    UPDATE public.profiles 
    SET 
      pokecoins = pokecoins + (total_rewards->>'coins')::integer,
      experience_points = experience_points + (total_rewards->>'xp')::integer,
      pokeshards = pokeshards + (total_rewards->>'shards')::integer,
      updated_at = now()
    WHERE user_id = p_user_id;
  END IF;
  
  RETURN QUERY SELECT completed_missions, total_rewards;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create function to reset daily/weekly missions
CREATE OR REPLACE FUNCTION public.reset_missions()
RETURNS void AS $$
BEGIN
  -- Reset daily missions (every 24 hours)
  UPDATE public.user_missions 
  SET 
    progress = 0, 
    completed = false, 
    completed_at = null,
    bonus_claimed = false,
    last_reset = now()
  FROM public.missions m
  WHERE user_missions.mission_id = m.id 
    AND m.type = 'daily'
    AND user_missions.last_reset < (now() - interval '24 hours');
  
  -- Reset weekly missions (every 7 days)
  UPDATE public.user_missions 
  SET 
    progress = 0, 
    completed = false, 
    completed_at = null,
    bonus_claimed = false,
    last_reset = now()
  FROM public.missions m
  WHERE user_missions.mission_id = m.id 
    AND m.type = 'weekly'
    AND user_missions.last_reset < (now() - interval '7 days');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;