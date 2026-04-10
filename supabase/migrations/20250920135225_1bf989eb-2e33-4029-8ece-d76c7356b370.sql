-- Create achievements table
CREATE TABLE public.achievements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL CHECK (category IN ('unique', 'progressive')),
  goal_type text NOT NULL,
  goal_value integer NOT NULL,
  base_reward_coins integer NOT NULL DEFAULT 0,
  base_reward_xp integer NOT NULL DEFAULT 0,
  base_reward_shards integer NOT NULL DEFAULT 0,
  base_reward_spins integer NOT NULL DEFAULT 0,
  increment_step integer DEFAULT 0,
  reward_increment numeric DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create user_achievements table
CREATE TABLE public.user_achievements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  achievement_id uuid NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  progress integer NOT NULL DEFAULT 0,
  completed_count integer NOT NULL DEFAULT 0,
  next_goal_value integer NOT NULL,
  is_completed boolean NOT NULL DEFAULT false,
  completed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- Enable RLS
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- RLS policies for achievements
CREATE POLICY "Achievements are viewable by everyone" 
ON public.achievements 
FOR SELECT 
USING (true);

-- RLS policies for user_achievements
CREATE POLICY "Users can view their own achievements" 
ON public.user_achievements 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own achievements" 
ON public.user_achievements 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own achievements" 
ON public.user_achievements 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create triggers for updated_at
CREATE TRIGGER update_achievements_updated_at
BEFORE UPDATE ON public.achievements
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_achievements_updated_at
BEFORE UPDATE ON public.user_achievements
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert unique achievements
INSERT INTO public.achievements (title, description, category, goal_type, goal_value, base_reward_shards, base_reward_coins, base_reward_spins) VALUES
('Trainer Nível 3', 'Alcance o nível 3 como treinador', 'unique', 'level', 3, 10, 0, 1),
('Trainer Nível 5', 'Alcance o nível 5 como treinador', 'unique', 'level', 5, 20, 25, 0),
('Trainer Nível 10', 'Alcance o nível 10 como treinador', 'unique', 'level', 10, 25, 30, 1),
('Trainer Nível 15', 'Alcance o nível 15 como treinador', 'unique', 'level', 15, 30, 40, 1),
('Veterano da Roleta', 'Rode a roleta 150 vezes', 'unique', 'spins', 150, 25, 0, 1),
('Caçador Lendário', 'Capture seu primeiro Pokémon lendário', 'unique', 'legendary_capture', 1, 20, 0, 1);

-- Insert progressive achievements
INSERT INTO public.achievements (title, description, category, goal_type, goal_value, base_reward_shards, base_reward_xp, increment_step, reward_increment) VALUES
('Girador da Sorte', 'Rode a roleta {goal} vezes', 'progressive', 'spins', 50, 10, 50, 25, 2.5),
('Comerciante', 'Venda {goal} cards', 'progressive', 'sales', 25, 10, 50, 10, 2.5);

-- Create function to track achievements
CREATE OR REPLACE FUNCTION public.update_achievement_progress(p_user_id uuid, p_goal_type text, p_increment integer DEFAULT 1)
RETURNS TABLE(achievements_completed json, rewards_earned json)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  achievement_record RECORD;
  completed_achievements json := '[]'::json;
  total_rewards json := '{"coins": 0, "xp": 0, "shards": 0, "spins": 0}'::json;
  current_level integer;
BEGIN
  -- Get current user level for level-based achievements
  IF p_goal_type = 'level' THEN
    SELECT level INTO current_level FROM public.profiles WHERE user_id = p_user_id;
    p_increment := current_level;
  END IF;

  -- Process all achievements for this goal type
  FOR achievement_record IN 
    SELECT a.*, 
           COALESCE(ua.progress, 0) as current_progress,
           COALESCE(ua.next_goal_value, a.goal_value) as target_goal,
           COALESCE(ua.completed_count, 0) as times_completed,
           ua.is_completed
    FROM public.achievements a
    LEFT JOIN public.user_achievements ua ON (a.id = ua.achievement_id AND ua.user_id = p_user_id)
    WHERE a.goal_type = p_goal_type
  LOOP
    -- Initialize user achievement if not exists
    INSERT INTO public.user_achievements (user_id, achievement_id, next_goal_value)
    VALUES (p_user_id, achievement_record.id, achievement_record.goal_value)
    ON CONFLICT (user_id, achievement_id) DO NOTHING;
    
    -- Skip if unique achievement already completed
    IF achievement_record.category = 'unique' AND achievement_record.is_completed THEN
      CONTINUE;
    END IF;
    
    -- Update progress
    IF p_goal_type = 'level' THEN
      -- For level achievements, set progress to current level
      UPDATE public.user_achievements 
      SET progress = p_increment, updated_at = now()
      WHERE user_id = p_user_id AND achievement_id = achievement_record.id;
    ELSE
      -- For other achievements, increment progress
      UPDATE public.user_achievements 
      SET progress = progress + p_increment, updated_at = now()
      WHERE user_id = p_user_id AND achievement_id = achievement_record.id;
    END IF;
    
    -- Get updated progress
    SELECT progress INTO achievement_record.current_progress
    FROM public.user_achievements
    WHERE user_id = p_user_id AND achievement_id = achievement_record.id;
    
    -- Check if achievement is completed
    IF achievement_record.current_progress >= achievement_record.target_goal THEN
      -- Calculate rewards (progressive achievements get increased rewards)
      DECLARE
        reward_coins integer := achievement_record.base_reward_coins;
        reward_xp integer := achievement_record.base_reward_xp;
        reward_shards numeric := achievement_record.base_reward_shards;
        reward_spins integer := achievement_record.base_reward_spins;
      BEGIN
        -- For progressive achievements, calculate increased rewards
        IF achievement_record.category = 'progressive' THEN
          reward_shards := achievement_record.base_reward_shards + (achievement_record.times_completed * achievement_record.reward_increment);
        END IF;
        
        -- Mark as completed and update counts
        IF achievement_record.category = 'unique' THEN
          UPDATE public.user_achievements 
          SET is_completed = true, completed_at = now(), updated_at = now()
          WHERE user_id = p_user_id AND achievement_id = achievement_record.id;
        ELSE
          -- Progressive: increment completed_count and set new goal
          UPDATE public.user_achievements 
          SET completed_count = completed_count + 1,
              next_goal_value = next_goal_value + achievement_record.increment_step,
              progress = 0,
              completed_at = now(),
              updated_at = now()
          WHERE user_id = p_user_id AND achievement_id = achievement_record.id;
        END IF;
        
        -- Add to completed achievements
        completed_achievements := completed_achievements || json_build_object(
          'id', achievement_record.id,
          'title', achievement_record.title,
          'description', achievement_record.description,
          'category', achievement_record.category,
          'reward_coins', reward_coins,
          'reward_xp', reward_xp,
          'reward_shards', reward_shards,
          'reward_spins', reward_spins
        );
        
        -- Add to total rewards
        total_rewards := json_build_object(
          'coins', (total_rewards->>'coins')::integer + reward_coins,
          'xp', (total_rewards->>'xp')::integer + reward_xp,
          'shards', (total_rewards->>'shards')::integer + reward_shards::integer,
          'spins', (total_rewards->>'spins')::integer + reward_spins
        );
      END;
    END IF;
  END LOOP;
  
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
  
  -- Apply spin rewards
  IF (total_rewards->>'spins')::integer > 0 THEN
    UPDATE public.user_spins 
    SET free_spins = free_spins + (total_rewards->>'spins')::integer,
        updated_at = now()
    WHERE user_id = p_user_id;
  END IF;
  
  RETURN QUERY SELECT completed_achievements, total_rewards;
END;
$$;