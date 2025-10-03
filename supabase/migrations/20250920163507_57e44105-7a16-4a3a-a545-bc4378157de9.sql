-- Fix claim_achievement_rewards function for progressive achievements
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
  
  -- For progressive achievements, check completion but not necessarily is_completed flag
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
  
  -- For progressive achievements, check if progress >= target goal and rewards not claimed
  -- For unique achievements, check if is_completed and rewards not claimed
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
  
  -- Mark as rewards claimed
  UPDATE public.user_achievements 
  SET rewards_claimed = true, updated_at = now()
  WHERE user_id = p_user_id AND achievement_id = p_achievement_id;
  
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

-- Fix sell_pokemon function to call mission progress update
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
  
  RETURN QUERY SELECT TRUE, 'Pokémon vendido com sucesso!'::TEXT, total_earned, new_pokecoins;
END;
$function$;