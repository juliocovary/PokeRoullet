-- Fix achievement progress function to handle level correctly
CREATE OR REPLACE FUNCTION public.update_achievement_progress(p_user_id uuid, p_goal_type text, p_increment integer DEFAULT 1)
 RETURNS TABLE(achievements_completed json, rewards_earned json)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  achievement_record RECORD;
  completed_achievements json := '[]'::json;
  total_rewards json := '{"coins": 0, "xp": 0, "shards": 0, "spins": 0}'::json;
  current_level integer;
BEGIN
  -- Log para debug
  RAISE LOG 'update_achievement_progress called for user % goal_type % increment %', p_user_id, p_goal_type, p_increment;

  -- Para conquistas de nível, obter o nível atual do usuário
  IF p_goal_type = 'level' THEN
    SELECT level INTO current_level FROM public.profiles WHERE user_id = p_user_id;
    RAISE LOG 'User current level: %', current_level;
  END IF;

  -- Process all achievements for this goal type
  FOR achievement_record IN 
    SELECT a.*, 
           COALESCE(ua.progress, 0) as current_progress,
           COALESCE(ua.next_goal_value, a.goal_value) as target_goal,
           COALESCE(ua.completed_count, 0) as times_completed,
           ua.is_completed,
           ua.rewards_claimed
    FROM public.achievements a
    LEFT JOIN public.user_achievements ua ON (a.id = ua.achievement_id AND ua.user_id = p_user_id)
    WHERE a.goal_type = p_goal_type
  LOOP
    -- Initialize user achievement if not exists
    INSERT INTO public.user_achievements (user_id, achievement_id, next_goal_value, rewards_claimed)
    VALUES (p_user_id, achievement_record.id, achievement_record.goal_value, false)
    ON CONFLICT (user_id, achievement_id) DO NOTHING;
    
    -- Skip if unique achievement already completed and rewards claimed
    IF achievement_record.category = 'unique' AND achievement_record.is_completed AND achievement_record.rewards_claimed THEN
      CONTINUE;
    END IF;
    
    -- Update progress
    IF p_goal_type = 'level' THEN
      -- Para conquistas de nível, definir progresso como o nível atual
      UPDATE public.user_achievements 
      SET progress = current_level, updated_at = now()
      WHERE user_id = p_user_id AND achievement_id = achievement_record.id;
      achievement_record.current_progress := current_level;
    ELSE
      -- Para outras conquistas, incrementar progresso
      UPDATE public.user_achievements 
      SET progress = progress + p_increment, updated_at = now()
      WHERE user_id = p_user_id AND achievement_id = achievement_record.id;
      
      -- Get updated progress
      SELECT progress INTO achievement_record.current_progress
      FROM public.user_achievements
      WHERE user_id = p_user_id AND achievement_id = achievement_record.id;
    END IF;
    
    RAISE LOG 'Achievement % progress: % / %', achievement_record.title, achievement_record.current_progress, achievement_record.target_goal;
    
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
        
        -- Mark as completed but DON'T apply rewards automatically
        IF achievement_record.category = 'unique' AND NOT achievement_record.is_completed THEN
          UPDATE public.user_achievements 
          SET is_completed = true, completed_at = now(), updated_at = now()
          WHERE user_id = p_user_id AND achievement_id = achievement_record.id;
          
          RAISE LOG 'Unique achievement % completed!', achievement_record.title;
          
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
        ELSIF achievement_record.category = 'progressive' THEN
          -- Progressive: increment completed_count and set new goal
          UPDATE public.user_achievements 
          SET completed_count = completed_count + 1,
              next_goal_value = next_goal_value + achievement_record.increment_step,
              progress = 0,
              completed_at = now(),
              updated_at = now()
          WHERE user_id = p_user_id AND achievement_id = achievement_record.id;
          
          RAISE LOG 'Progressive achievement % completed! New goal: %', achievement_record.title, achievement_record.target_goal + achievement_record.increment_step;
          
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
        END IF;
      END;
    END IF;
  END LOOP;
  
  RETURN QUERY SELECT completed_achievements, total_rewards;
END;
$function$;