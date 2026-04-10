-- Fix claim_launch_event_rewards to validate auth.uid() matches p_user_id
CREATE OR REPLACE FUNCTION public.claim_launch_event_rewards(p_user_id uuid, p_mission_order integer)
 RETURNS TABLE(success boolean, message text, rewards json)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_mission RECORD;
  v_progress RECORD;
BEGIN
  -- Auth validation - prevent claiming rewards for other users
  IF p_user_id != auth.uid() THEN
    RETURN QUERY SELECT FALSE, 'Unauthorized: cannot modify another user''s data'::TEXT, '{}'::JSON;
    RETURN;
  END IF;

  -- Buscar missão
  SELECT * INTO v_mission
  FROM launch_event_missions
  WHERE mission_order = p_mission_order;
  
  IF v_mission IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Missão não encontrada'::TEXT, '{}'::JSON;
    RETURN;
  END IF;
  
  -- Buscar progresso do usuário
  SELECT * INTO v_progress
  FROM user_launch_event_progress
  WHERE user_id = p_user_id AND mission_order = p_mission_order;
  
  IF v_progress IS NULL OR NOT v_progress.completed THEN
    RETURN QUERY SELECT FALSE, 'Missão ainda não completada'::TEXT, '{}'::JSON;
    RETURN;
  END IF;
  
  IF v_progress.rewards_claimed THEN
    RETURN QUERY SELECT FALSE, 'Recompensas já resgatadas'::TEXT, '{}'::JSON;
    RETURN;
  END IF;
  
  -- Marcar como resgatada
  UPDATE user_launch_event_progress
  SET rewards_claimed = true, updated_at = now()
  WHERE user_id = p_user_id AND mission_order = p_mission_order;
  
  -- Aplicar recompensas de coins e shards
  UPDATE profiles
  SET 
    pokecoins = pokecoins + v_mission.reward_coins,
    pokeshards = pokeshards + v_mission.reward_shards,
    updated_at = now()
  WHERE user_id = p_user_id;
  
  -- Aplicar spins
  IF v_mission.reward_spins > 0 THEN
    UPDATE user_spins
    SET free_spins = free_spins + v_mission.reward_spins, updated_at = now()
    WHERE user_id = p_user_id;
  END IF;
  
  -- Aplicar Mystery Boxes (item_id = 52)
  IF v_mission.reward_mystery_boxes > 0 THEN
    INSERT INTO user_items (user_id, item_id, quantity)
    VALUES (p_user_id, 52, v_mission.reward_mystery_boxes)
    ON CONFLICT (user_id, item_id)
    DO UPDATE SET quantity = user_items.quantity + v_mission.reward_mystery_boxes, updated_at = now();
  END IF;
  
  -- Aplicar Luck Potion (item_id = 50)
  IF v_mission.reward_luck_potion > 0 THEN
    INSERT INTO user_items (user_id, item_id, quantity)
    VALUES (p_user_id, 50, v_mission.reward_luck_potion)
    ON CONFLICT (user_id, item_id)
    DO UPDATE SET quantity = user_items.quantity + v_mission.reward_luck_potion, updated_at = now();
  END IF;
  
  -- Aplicar Shiny Potion (item_id = 51)
  IF v_mission.reward_shiny_potion > 0 THEN
    INSERT INTO user_items (user_id, item_id, quantity)
    VALUES (p_user_id, 51, v_mission.reward_shiny_potion)
    ON CONFLICT (user_id, item_id)
    DO UPDATE SET quantity = user_items.quantity + v_mission.reward_shiny_potion, updated_at = now();
  END IF;
  
  -- Aplicar Legendary Spin (item_id = 53)
  IF v_mission.reward_legendary_spin > 0 THEN
    INSERT INTO user_items (user_id, item_id, quantity)
    VALUES (p_user_id, 53, v_mission.reward_legendary_spin)
    ON CONFLICT (user_id, item_id)
    DO UPDATE SET quantity = user_items.quantity + v_mission.reward_legendary_spin, updated_at = now();
  END IF;
  
  RETURN QUERY SELECT 
    TRUE, 
    'Recompensas resgatadas com sucesso!'::TEXT,
    json_build_object(
      'coins', v_mission.reward_coins,
      'shards', v_mission.reward_shards,
      'spins', v_mission.reward_spins,
      'mystery_boxes', v_mission.reward_mystery_boxes,
      'luck_potion', v_mission.reward_luck_potion,
      'shiny_potion', v_mission.reward_shiny_potion,
      'legendary_spin', v_mission.reward_legendary_spin
    );
END;
$function$;