-- Fix progressive achievements to not auto-advance until rewards are claimed
-- And ensure sell action updates achievements properly

-- Update the update_achievement_progress function to NOT auto-advance progressive achievements
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
  temp_array json[];
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
    
    -- For progressive achievements, skip if rewards haven't been claimed and achievement is completed
    IF achievement_record.category = 'progressive' AND achievement_record.current_progress >= achievement_record.target_goal AND NOT achievement_record.rewards_claimed THEN
      RAISE LOG 'Skipping progressive achievement % - waiting for reward claim', achievement_record.title;
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
          
          -- Add to completed achievements using array concatenation
          temp_array := ARRAY[json_build_object(
            'id', achievement_record.id,
            'title', achievement_record.title,
            'description', achievement_record.description,
            'category', achievement_record.category,
            'reward_coins', reward_coins,
            'reward_xp', reward_xp,
            'reward_shards', reward_shards,
            'reward_spins', reward_spins
          )];
          
          completed_achievements := array_to_json(ARRAY(SELECT json_array_elements(completed_achievements)) || temp_array);
        ELSIF achievement_record.category = 'progressive' THEN
          -- Progressive: mark as ready for claiming but DON'T advance to next goal yet
          UPDATE public.user_achievements 
          SET completed_at = now(), updated_at = now()
          WHERE user_id = p_user_id AND achievement_id = achievement_record.id;
          
          RAISE LOG 'Progressive achievement % completed and ready for claiming!', achievement_record.title;
          
          -- Add to completed achievements using array concatenation
          temp_array := ARRAY[json_build_object(
            'id', achievement_record.id,
            'title', achievement_record.title,
            'description', achievement_record.description,
            'category', achievement_record.category,
            'reward_coins', reward_coins,
            'reward_xp', reward_xp,
            'reward_shards', reward_shards,
            'reward_spins', reward_spins
          )];
          
          completed_achievements := array_to_json(ARRAY(SELECT json_array_elements(completed_achievements)) || temp_array);
        END IF;
      END;
    END IF;
  END LOOP;
  
  RETURN QUERY SELECT completed_achievements, total_rewards;
END;
$function$;

-- Update claim_achievement_rewards to advance progressive achievements AFTER claiming
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
  SELECT a.*, ua.is_completed, ua.rewards_claimed, ua.completed_count, ua.progress, ua.next_goal_value
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
  
  RAISE LOG 'Achievement found: % category % completed % rewards_claimed % progress %', 
    achievement_record.title, achievement_record.category, achievement_record.is_completed, 
    achievement_record.rewards_claimed, achievement_record.progress;
  
  -- Check if achievement is actually completed and rewards not yet claimed
  IF achievement_record.category = 'progressive' THEN
    IF achievement_record.progress < achievement_record.next_goal_value THEN
      RAISE LOG 'Progressive achievement not completed yet: progress % < target %', 
        achievement_record.progress, achievement_record.next_goal_value;
      RETURN QUERY SELECT false, 'Conquista ainda não completada'::TEXT, '{}'::json;
      RETURN;
    END IF;
    
    IF achievement_record.rewards_claimed THEN
      RAISE LOG 'Progressive achievement rewards already claimed';
      RETURN QUERY SELECT false, 'Recompensas já coletadas'::TEXT, '{}'::json;
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
    -- Progressive: increment completed_count, set new goal, reset progress, mark as claimed
    UPDATE public.user_achievements 
    SET completed_count = completed_count + 1,
        next_goal_value = next_goal_value + achievement_record.increment_step,
        progress = 0,
        rewards_claimed = false,  -- Reset for next level
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

-- Update sell_pokemon to also call achievement progress
CREATE OR REPLACE FUNCTION public.sell_pokemon(p_user_id uuid, p_pokemon_id integer, p_quantity integer)
 RETURNS TABLE(success boolean, message text, pokecoins_earned integer, new_pokecoins integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  current_quantity INTEGER;
  pokemon_rarity TEXT;
  pokemon_name_value TEXT;
  is_starter BOOLEAN;
  coin_value INTEGER;
  total_earned INTEGER;
  mission_result RECORD;
  achievement_result RECORD;
BEGIN
  RAISE LOG 'sell_pokemon called for user % pokemon % quantity %', p_user_id, p_pokemon_id, p_quantity;
  
  -- Get current quantity, rarity and pokemon name
  SELECT quantity, rarity, pokemon_name INTO current_quantity, pokemon_rarity, pokemon_name_value
  FROM public.pokemon_inventory
  WHERE user_id = p_user_id AND pokemon_id = p_pokemon_id;
  
  -- Check if pokemon exists in inventory
  IF current_quantity IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Pokémon não encontrado no inventário'::TEXT, 0::INTEGER, 0::INTEGER;
    RETURN;
  END IF;
  
  -- Check if user has enough quantity
  IF p_quantity > current_quantity THEN
    RETURN QUERY SELECT FALSE, 'Quantidade insuficiente'::TEXT, 0::INTEGER, 0::INTEGER;
    RETURN;
  END IF;
  
  -- Check if it's a starter pokemon by comparing names
  SELECT EXISTS(
    SELECT 1 FROM public.profiles 
    WHERE user_id = p_user_id 
    AND starter_pokemon IS NOT NULL
    AND starter_pokemon = pokemon_name_value
  ) INTO is_starter;
  
  IF is_starter THEN
    RETURN QUERY SELECT FALSE, 'Não é possível vender seu Pokémon inicial'::TEXT, 0::INTEGER, 0::INTEGER;
    RETURN;
  END IF;
  
  -- Calculate coin value based on rarity
  coin_value := CASE pokemon_rarity
    WHEN 'common' THEN 1
    WHEN 'uncommon' THEN 2
    WHEN 'rare' THEN 5
    WHEN 'pseudo' THEN 25
    WHEN 'legendary' THEN 150
    WHEN 'secret' THEN 500
    ELSE 1
  END;
  
  total_earned := coin_value * p_quantity;
  
  -- Update pokemon inventory
  IF p_quantity = current_quantity THEN
    -- Remove completely if selling all
    DELETE FROM public.pokemon_inventory
    WHERE user_id = p_user_id AND pokemon_id = p_pokemon_id;
  ELSE
    -- Reduce quantity
    UPDATE public.pokemon_inventory
    SET quantity = quantity - p_quantity
    WHERE user_id = p_user_id AND pokemon_id = p_pokemon_id;
  END IF;
  
  -- Add pokecoins to user
  UPDATE public.profiles
  SET pokecoins = pokecoins + total_earned,
      updated_at = now()
  WHERE user_id = p_user_id;
  
  -- Get new pokecoins total
  SELECT pokecoins INTO new_pokecoins
  FROM public.profiles
  WHERE user_id = p_user_id;
  
  RAISE LOG 'Pokemon sold successfully, earned % coins', total_earned;
  
  -- Update mission progress for selling cards
  SELECT missions_completed, rewards_earned 
  INTO mission_result
  FROM update_mission_progress(p_user_id, 'sell', p_quantity);
  
  RAISE LOG 'Mission progress updated for selling cards';
  
  -- Update achievement progress for selling cards
  SELECT achievements_completed, rewards_earned 
  INTO achievement_result
  FROM update_achievement_progress(p_user_id, 'sell', p_quantity);
  
  RAISE LOG 'Achievement progress updated for selling cards';
  
  RETURN QUERY SELECT TRUE, 'Pokémon vendido com sucesso!'::TEXT, total_earned, new_pokecoins;
END;
$function$;

-- Add daily completion bonus claiming function
CREATE OR REPLACE FUNCTION public.claim_daily_completion_bonus(p_user_id uuid)
 RETURNS TABLE(success boolean, message text, rewards json)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  daily_missions_count INTEGER;
  completed_daily_missions_count INTEGER;
  bonus_claimed BOOLEAN := false;
BEGIN
  -- Check how many daily missions exist and how many are completed
  SELECT COUNT(*) INTO daily_missions_count
  FROM public.missions
  WHERE type = 'daily';
  
  SELECT COUNT(*) INTO completed_daily_missions_count
  FROM public.missions m
  JOIN public.user_missions um ON m.id = um.mission_id
  WHERE m.type = 'daily' 
    AND um.user_id = p_user_id 
    AND um.completed = true
    AND um.rewards_claimed = true;
  
  -- Check if all daily missions are completed and claimed
  IF completed_daily_missions_count < daily_missions_count THEN
    RETURN QUERY SELECT false, 'Nem todas as missões diárias foram completadas e coletadas'::TEXT, '{}'::json;
    RETURN;
  END IF;
  
  -- Check if bonus was already claimed today (simple check - can be improved with proper tracking)
  -- For now, we'll allow claiming multiple times until we add proper tracking
  
  -- Apply daily completion bonus
  UPDATE public.profiles 
  SET 
    pokecoins = pokecoins + 15,
    experience_points = experience_points + 100,
    pokeshards = pokeshards + 15,
    updated_at = now()
  WHERE user_id = p_user_id;
  
  RETURN QUERY SELECT 
    true, 
    'Bônus de conclusão diária coletado!'::TEXT,
    json_build_object(
      'coins', 15,
      'xp', 100,
      'shards', 15
    );
END;
$function$;

-- Add weekly completion bonus claiming function
CREATE OR REPLACE FUNCTION public.claim_weekly_completion_bonus(p_user_id uuid)
 RETURNS TABLE(success boolean, message text, rewards json)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  weekly_missions_count INTEGER;
  completed_weekly_missions_count INTEGER;
BEGIN
  -- Check how many weekly missions exist and how many are completed
  SELECT COUNT(*) INTO weekly_missions_count
  FROM public.missions
  WHERE type = 'weekly';
  
  SELECT COUNT(*) INTO completed_weekly_missions_count
  FROM public.missions m
  JOIN public.user_missions um ON m.id = um.mission_id
  WHERE m.type = 'weekly' 
    AND um.user_id = p_user_id 
    AND um.completed = true
    AND um.rewards_claimed = true;
  
  -- Check if all weekly missions are completed and claimed
  IF completed_weekly_missions_count < weekly_missions_count THEN
    RETURN QUERY SELECT false, 'Nem todas as missões semanais foram completadas e coletadas'::TEXT, '{}'::json;
    RETURN;
  END IF;
  
  -- Apply weekly completion bonus
  UPDATE public.profiles 
  SET 
    pokecoins = pokecoins + 75,
    experience_points = experience_points + 250,
    pokeshards = pokeshards + 50,
    updated_at = now()
  WHERE user_id = p_user_id;
  
  RETURN QUERY SELECT 
    true, 
    'Bônus de conclusão semanal coletado!'::TEXT,
    json_build_object(
      'coins', 75,
      'xp', 250,
      'shards', 50
    );
END;
$function$;