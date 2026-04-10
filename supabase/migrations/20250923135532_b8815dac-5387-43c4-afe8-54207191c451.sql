CREATE OR REPLACE FUNCTION public.claim_achievement_rewards(p_user_id uuid, p_achievement_id uuid)
 RETURNS TABLE(success boolean, message text, rewards json)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  achievement_record RECORD;
  reward_coins integer := 0;
  reward_xp integer := 0;
  reward_shards integer := 0;
  reward_spins integer := 0;
BEGIN
  RAISE LOG 'claim_achievement_rewards called for user % achievement %', p_user_id, p_achievement_id;
  
  -- Get achievement data
  SELECT a.*, ua.is_completed, ua.rewards_claimed, ua.completed_count, ua.progress, ua.next_goal_value, ua.completed_at
  INTO achievement_record
  FROM public.achievements a
  JOIN public.user_achievements ua ON a.id = ua.achievement_id
  WHERE a.id = p_achievement_id 
    AND ua.user_id = p_user_id;
  
  IF achievement_record IS NULL THEN
    RAISE LOG 'Achievement record not found for user % achievement %', p_user_id, p_achievement_id;
    RETURN QUERY SELECT false, 'Conquista não encontrada'::TEXT, '{}'::json;
    RETURN;
  END IF;
  
  RAISE LOG 'Achievement found: % category % completed % rewards_claimed % progress % goal %', 
    achievement_record.title, achievement_record.category, achievement_record.is_completed, 
    achievement_record.rewards_claimed, achievement_record.progress, achievement_record.next_goal_value;
  
  -- Check if achievement is actually completed and rewards not yet claimed
  IF achievement_record.category = 'progressive' THEN
    -- For progressive: check if progress >= goal and completed_at is set (means ready to claim)
    IF achievement_record.progress < achievement_record.next_goal_value THEN
      RAISE LOG 'Progressive achievement not completed yet: progress % < target %', 
        achievement_record.progress, achievement_record.next_goal_value;
      RETURN QUERY SELECT false, 'Conquista ainda não completada'::TEXT, '{}'::json;
      RETURN;
    END IF;
    
    -- For progressive: check if there's a completed_at timestamp (means it's ready to claim)
    IF achievement_record.completed_at IS NULL THEN
      RAISE LOG 'Progressive achievement not marked as completed yet';
      RETURN QUERY SELECT false, 'Conquista ainda não está pronta para coleta'::TEXT, '{}'::json;
      RETURN;
    END IF;
    
    -- For progressive achievements, we only block claiming if rewards_claimed = true AND completed_at is not null
    -- This means the current level was already claimed
    IF achievement_record.rewards_claimed AND achievement_record.completed_at IS NOT NULL THEN
      RAISE LOG 'Progressive achievement rewards already claimed for current level';
      RETURN QUERY SELECT false, 'Recompensas já coletadas para este nível'::TEXT, '{}'::json;
      RETURN;
    END IF;
  ELSE
    -- Unique achievement logic
    IF NOT achievement_record.is_completed OR achievement_record.rewards_claimed THEN
      RAISE LOG 'Unique achievement not completed or already claimed: completed % claimed %', 
        achievement_record.is_completed, achievement_record.rewards_claimed;
      RETURN QUERY SELECT false, 'Conquista não encontrada ou já coletada'::TEXT, '{}'::json;
      RETURN;
    END IF;
  END IF;
  
  -- Calculate rewards
  reward_coins := achievement_record.base_reward_coins;
  reward_xp := achievement_record.base_reward_xp;
  reward_shards := achievement_record.base_reward_shards;
  reward_spins := achievement_record.base_reward_spins;
  
  -- For progressive achievements, increase rewards based on completed count
  IF achievement_record.category = 'progressive' THEN
    reward_shards := reward_shards + (achievement_record.completed_count * achievement_record.reward_increment);
  END IF;
  
  -- Mark as rewards claimed and advance progressive achievements
  IF achievement_record.category = 'progressive' THEN
    -- Progressive: increment completed_count, set new goal, reset completed_at and rewards_claimed
    UPDATE public.user_achievements 
    SET completed_count = completed_count + 1,
        next_goal_value = next_goal_value + achievement_record.increment_step,
        completed_at = NULL,  -- Reset completed_at so it needs to be completed again
        rewards_claimed = false,  -- Reset rewards_claimed for the next level
        updated_at = now()
    WHERE user_id = p_user_id AND achievement_id = p_achievement_id;
    
    RAISE LOG 'Progressive achievement advanced to next level. New goal: %', achievement_record.next_goal_value + achievement_record.increment_step;
  ELSE
    -- Unique: just mark as claimed
    UPDATE public.user_achievements 
    SET rewards_claimed = true, updated_at = now()
    WHERE user_id = p_user_id AND achievement_id = p_achievement_id;
  END IF;
  
  RAISE LOG 'Marked rewards as claimed for achievement %', achievement_record.title;
  
  -- Apply rewards
  UPDATE public.profiles 
  SET 
    pokecoins = pokecoins + reward_coins,
    experience_points = experience_points + reward_xp,
    pokeshards = pokeshards + reward_shards,
    updated_at = now()
  WHERE user_id = p_user_id;
  
  RAISE LOG 'Applied rewards: coins % xp % shards %', reward_coins, reward_xp, reward_shards;
  
  -- Apply free spins if any
  IF reward_spins > 0 THEN
    UPDATE public.user_spins 
    SET free_spins = free_spins + reward_spins, updated_at = now()
    WHERE user_id = p_user_id;
    
    RAISE LOG 'Added % free spins', reward_spins;
  END IF;
  
  RETURN QUERY SELECT 
    true, 
    'Recompensas coletadas com sucesso!'::TEXT,
    json_build_object(
      'coins', reward_coins,
      'xp', reward_xp,
      'shards', reward_shards,
      'spins', reward_spins
    );
END;
$function$;