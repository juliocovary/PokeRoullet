-- First, resolve duplicate nicknames by appending a suffix
WITH duplicates AS (
  SELECT id, nickname, 
         ROW_NUMBER() OVER (PARTITION BY nickname ORDER BY created_at) as rn
  FROM profiles
)
UPDATE profiles p
SET nickname = p.nickname || '_' || d.rn
FROM duplicates d
WHERE p.id = d.id AND d.rn > 1;

-- Now add unique constraint on nickname to prevent race conditions
ALTER TABLE public.profiles ADD CONSTRAINT profiles_nickname_unique UNIQUE (nickname);

-- Update SECURITY DEFINER functions to validate auth.uid()

-- Fix increase_luck_multiplier
CREATE OR REPLACE FUNCTION public.increase_luck_multiplier(p_user_id uuid, p_amount numeric)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: cannot modify another user''s data';
  END IF;

  UPDATE profiles 
  SET luck_multiplier = luck_multiplier + p_amount,
      updated_at = now()
  WHERE user_id = p_user_id;
  
  RETURN FOUND;
END;
$function$;

-- Fix increase_xp_multiplier
CREATE OR REPLACE FUNCTION public.increase_xp_multiplier(p_user_id uuid, p_percentage numeric)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: cannot modify another user''s data';
  END IF;

  UPDATE profiles 
  SET xp_multiplier = xp_multiplier * (1 + p_percentage / 100),
      updated_at = now()
  WHERE user_id = p_user_id;
  
  RETURN FOUND;
END;
$function$;

-- Fix increase_base_spins
CREATE OR REPLACE FUNCTION public.increase_base_spins(p_user_id uuid, p_amount integer)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: cannot modify another user''s data';
  END IF;

  UPDATE public.user_spins 
  SET base_free_spins = base_free_spins + p_amount,
      updated_at = now()
  WHERE user_id = p_user_id;
  
  RETURN FOUND;
END;
$function$;

-- Fix unlock_region
CREATE OR REPLACE FUNCTION public.unlock_region(p_user_id uuid, p_region text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: cannot modify another user''s data';
  END IF;

  UPDATE public.profiles
  SET unlocked_regions = array_append(unlocked_regions, p_region)
  WHERE user_id = p_user_id
  AND NOT (p_region = ANY(unlocked_regions));
  
  RETURN FOUND;
END;
$function$;

-- Fix sell_pokemon (with shiny parameter)
CREATE OR REPLACE FUNCTION public.sell_pokemon(p_user_id uuid, p_pokemon_id integer, p_quantity integer, p_is_shiny boolean DEFAULT false)
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
  IF p_user_id != auth.uid() THEN
    RETURN QUERY SELECT FALSE, 'Unauthorized: cannot modify another user''s data'::TEXT, 0::INTEGER, 0::INTEGER;
    RETURN;
  END IF;

  SELECT quantity, rarity, pokemon_name INTO current_quantity, pokemon_rarity, pokemon_name_value
  FROM public.pokemon_inventory
  WHERE user_id = p_user_id AND pokemon_id = p_pokemon_id AND is_shiny = p_is_shiny;
  
  IF current_quantity IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Pokémon não encontrado no inventário'::TEXT, 0::INTEGER, 0::INTEGER;
    RETURN;
  END IF;
  
  IF p_quantity > current_quantity THEN
    RETURN QUERY SELECT FALSE, 'Quantidade insuficiente'::TEXT, 0::INTEGER, 0::INTEGER;
    RETURN;
  END IF;
  
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
  
  coin_value := CASE pokemon_rarity
    WHEN 'common' THEN 1
    WHEN 'uncommon' THEN 2
    WHEN 'rare' THEN 5
    WHEN 'pseudo' THEN 25
    WHEN 'legendary' THEN 150
    WHEN 'secret' THEN 500
    ELSE 1
  END;
  
  IF p_is_shiny THEN
    coin_value := coin_value * 3;
  END IF;
  
  total_earned := coin_value * p_quantity;
  
  IF p_quantity = current_quantity THEN
    DELETE FROM public.pokemon_inventory
    WHERE user_id = p_user_id AND pokemon_id = p_pokemon_id AND is_shiny = p_is_shiny;
  ELSE
    UPDATE public.pokemon_inventory
    SET quantity = quantity - p_quantity
    WHERE user_id = p_user_id AND pokemon_id = p_pokemon_id AND is_shiny = p_is_shiny;
  END IF;
  
  UPDATE public.profiles
  SET pokecoins = pokecoins + total_earned,
      updated_at = now()
  WHERE user_id = p_user_id;
  
  SELECT pokecoins INTO new_pokecoins
  FROM public.profiles
  WHERE user_id = p_user_id;
  
  SELECT missions_completed, rewards_earned 
  INTO mission_result
  FROM update_mission_progress(p_user_id, 'sell', p_quantity);
  
  SELECT achievements_completed, rewards_earned 
  INTO achievement_result
  FROM update_achievement_progress(p_user_id, 'sales', p_quantity);
  
  RETURN QUERY SELECT TRUE, 'Pokémon vendido com sucesso!'::TEXT, total_earned, new_pokecoins;
END;
$function$;

-- Fix buy_item
CREATE OR REPLACE FUNCTION public.buy_item(p_user_id uuid, p_item_id integer, p_quantity integer DEFAULT 1)
 RETURNS TABLE(success boolean, message text, new_pokecoins integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  item_price INTEGER;
  current_pokecoins INTEGER;
  total_cost INTEGER;
BEGIN
  IF p_user_id != auth.uid() THEN
    RETURN QUERY SELECT FALSE, 'Unauthorized: cannot modify another user''s data'::TEXT, 0::INTEGER;
    RETURN;
  END IF;

  SELECT price INTO item_price
  FROM public.items
  WHERE id = p_item_id;
  
  IF item_price IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Item não encontrado'::TEXT, 0::INTEGER;
    RETURN;
  END IF;
  
  total_cost := item_price * p_quantity;
  
  SELECT pokecoins INTO current_pokecoins
  FROM public.profiles
  WHERE user_id = p_user_id;
  
  IF current_pokecoins < total_cost THEN
    RETURN QUERY SELECT FALSE, 'Pokécoins insuficientes'::TEXT, current_pokecoins;
    RETURN;
  END IF;
  
  UPDATE public.profiles 
  SET pokecoins = pokecoins - total_cost,
      updated_at = now()
  WHERE user_id = p_user_id;
  
  INSERT INTO public.user_items (user_id, item_id, quantity)
  VALUES (p_user_id, p_item_id, p_quantity)
  ON CONFLICT (user_id, item_id)
  DO UPDATE SET 
    quantity = user_items.quantity + p_quantity,
    updated_at = now();
  
  SELECT pokecoins INTO current_pokecoins
  FROM public.profiles
  WHERE user_id = p_user_id;
  
  RETURN QUERY SELECT TRUE, 'Item comprado com sucesso!'::TEXT, current_pokecoins;
END;
$function$;

-- Fix create_marketplace_listing
CREATE OR REPLACE FUNCTION public.create_marketplace_listing(p_user_id uuid, p_pokemon_id integer, p_price integer, p_is_shiny boolean DEFAULT false)
 RETURNS TABLE(success boolean, message text, listing_id uuid)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_quantity INTEGER;
  v_pokemon_name TEXT;
  v_rarity TEXT;
  v_nickname TEXT;
  v_new_listing_id UUID;
BEGIN
  IF p_user_id != auth.uid() THEN
    RETURN QUERY SELECT FALSE, 'Unauthorized: cannot modify another user''s data'::TEXT, NULL::UUID;
    RETURN;
  END IF;

  IF p_price < 1 OR p_price > 9999 THEN
    RETURN QUERY SELECT FALSE, 'Preço deve ser entre 1 e 9999 Pokécoins'::TEXT, NULL::UUID;
    RETURN;
  END IF;

  SELECT quantity, pokemon_name, rarity INTO v_quantity, v_pokemon_name, v_rarity
  FROM public.pokemon_inventory
  WHERE user_id = p_user_id AND pokemon_id = p_pokemon_id AND is_shiny = p_is_shiny;

  IF v_quantity IS NULL OR v_quantity < 1 THEN
    RETURN QUERY SELECT FALSE, 'Você não possui este Pokémon no inventário'::TEXT, NULL::UUID;
    RETURN;
  END IF;

  SELECT nickname INTO v_nickname
  FROM public.profiles
  WHERE user_id = p_user_id;

  IF v_quantity = 1 THEN
    DELETE FROM public.pokemon_inventory
    WHERE user_id = p_user_id AND pokemon_id = p_pokemon_id AND is_shiny = p_is_shiny;
  ELSE
    UPDATE public.pokemon_inventory
    SET quantity = quantity - 1, created_at = NOW()
    WHERE user_id = p_user_id AND pokemon_id = p_pokemon_id AND is_shiny = p_is_shiny;
  END IF;

  INSERT INTO public.marketplace_listings (
    seller_id, seller_nickname, pokemon_id, pokemon_name, rarity, is_shiny, price
  ) VALUES (
    p_user_id, v_nickname, p_pokemon_id, v_pokemon_name, v_rarity, p_is_shiny, p_price
  )
  RETURNING id INTO v_new_listing_id;

  RETURN QUERY SELECT TRUE, 'Oferta criada com sucesso!'::TEXT, v_new_listing_id;
END;
$function$;

-- Fix buy_marketplace_listing
CREATE OR REPLACE FUNCTION public.buy_marketplace_listing(p_user_id uuid, p_listing_id uuid)
 RETURNS TABLE(success boolean, message text, pokemon_name text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_listing RECORD;
  v_buyer_coins INTEGER;
BEGIN
  IF p_user_id != auth.uid() THEN
    RETURN QUERY SELECT FALSE, 'Unauthorized: cannot modify another user''s data'::TEXT, NULL::TEXT;
    RETURN;
  END IF;

  SELECT * INTO v_listing
  FROM public.marketplace_listings
  WHERE id = p_listing_id AND status = 'active'
  FOR UPDATE;

  IF v_listing IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Oferta não encontrada ou já vendida'::TEXT, NULL::TEXT;
    RETURN;
  END IF;

  IF v_listing.seller_id = p_user_id THEN
    RETURN QUERY SELECT FALSE, 'Você não pode comprar sua própria oferta'::TEXT, NULL::TEXT;
    RETURN;
  END IF;

  SELECT pokecoins INTO v_buyer_coins
  FROM public.profiles
  WHERE user_id = p_user_id;

  IF v_buyer_coins < v_listing.price THEN
    RETURN QUERY SELECT FALSE, 'Pokécoins insuficientes'::TEXT, NULL::TEXT;
    RETURN;
  END IF;

  UPDATE public.profiles
  SET pokecoins = pokecoins - v_listing.price, updated_at = NOW()
  WHERE user_id = p_user_id;

  UPDATE public.profiles
  SET pokecoins = pokecoins + v_listing.price, updated_at = NOW()
  WHERE user_id = v_listing.seller_id;

  INSERT INTO public.pokemon_inventory (user_id, pokemon_id, pokemon_name, rarity, is_shiny, quantity)
  VALUES (p_user_id, v_listing.pokemon_id, v_listing.pokemon_name, v_listing.rarity, v_listing.is_shiny, 1)
  ON CONFLICT (user_id, pokemon_id, is_shiny)
  DO UPDATE SET quantity = pokemon_inventory.quantity + 1, created_at = NOW();

  UPDATE public.marketplace_listings
  SET status = 'sold', buyer_id = p_user_id, sold_at = NOW(), updated_at = NOW()
  WHERE id = p_listing_id;

  RETURN QUERY SELECT TRUE, 'Compra realizada com sucesso!'::TEXT, v_listing.pokemon_name;
END;
$function$;

-- Fix cancel_marketplace_listing
CREATE OR REPLACE FUNCTION public.cancel_marketplace_listing(p_user_id uuid, p_listing_id uuid)
 RETURNS TABLE(success boolean, message text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_listing RECORD;
BEGIN
  IF p_user_id != auth.uid() THEN
    RETURN QUERY SELECT FALSE, 'Unauthorized: cannot modify another user''s data'::TEXT;
    RETURN;
  END IF;

  SELECT * INTO v_listing
  FROM public.marketplace_listings
  WHERE id = p_listing_id AND status = 'active' AND seller_id = p_user_id
  FOR UPDATE;

  IF v_listing IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Oferta não encontrada ou você não é o vendedor'::TEXT;
    RETURN;
  END IF;

  INSERT INTO public.pokemon_inventory (user_id, pokemon_id, pokemon_name, rarity, is_shiny, quantity)
  VALUES (p_user_id, v_listing.pokemon_id, v_listing.pokemon_name, v_listing.rarity, v_listing.is_shiny, 1)
  ON CONFLICT (user_id, pokemon_id, is_shiny)
  DO UPDATE SET quantity = pokemon_inventory.quantity + 1, created_at = NOW();

  UPDATE public.marketplace_listings
  SET status = 'cancelled', updated_at = NOW()
  WHERE id = p_listing_id;

  RETURN QUERY SELECT TRUE, 'Oferta cancelada com sucesso!'::TEXT;
END;
$function$;

-- Fix claim_mission_rewards
CREATE OR REPLACE FUNCTION public.claim_mission_rewards(p_user_id uuid, p_mission_id uuid)
 RETURNS TABLE(success boolean, message text, rewards json)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  mission_record RECORD;
  xp_result RECORD;
BEGIN
  IF p_user_id != auth.uid() THEN
    RETURN QUERY SELECT false, 'Unauthorized: cannot modify another user''s data'::TEXT, '{}'::json;
    RETURN;
  END IF;

  SELECT m.*, um.completed, um.rewards_claimed 
  INTO mission_record
  FROM public.missions m
  JOIN public.user_missions um ON m.id = um.mission_id
  WHERE m.id = p_mission_id 
    AND um.user_id = p_user_id 
    AND um.completed = true 
    AND um.rewards_claimed = false;
  
  IF mission_record IS NULL THEN
    RETURN QUERY SELECT false, 'Missão não encontrada ou já coletada'::TEXT, '{}'::json;
    RETURN;
  END IF;
  
  UPDATE public.user_missions 
  SET rewards_claimed = true, updated_at = now()
  WHERE user_id = p_user_id AND mission_id = p_mission_id;
  
  UPDATE public.profiles 
  SET 
    pokecoins = pokecoins + mission_record.reward_coins,
    pokeshards = pokeshards + mission_record.reward_shards,
    updated_at = now()
  WHERE user_id = p_user_id;
  
  IF mission_record.reward_xp > 0 THEN
    SELECT * INTO xp_result FROM add_experience(p_user_id, mission_record.reward_xp);
  END IF;
  
  RETURN QUERY SELECT 
    true, 
    'Recompensas coletadas com sucesso!'::TEXT,
    json_build_object(
      'coins', mission_record.reward_coins,
      'xp', mission_record.reward_xp,
      'shards', mission_record.reward_shards
    );
END;
$function$;

-- Fix claim_achievement_rewards
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
  xp_result RECORD;
BEGIN
  IF p_user_id != auth.uid() THEN
    RETURN QUERY SELECT false, 'Unauthorized: cannot modify another user''s data'::TEXT, '{}'::json;
    RETURN;
  END IF;

  SELECT a.*, ua.is_completed, ua.rewards_claimed, ua.completed_count, ua.progress, ua.next_goal_value, ua.completed_at
  INTO achievement_record
  FROM public.achievements a
  JOIN public.user_achievements ua ON a.id = ua.achievement_id
  WHERE a.id = p_achievement_id 
    AND ua.user_id = p_user_id;
  
  IF achievement_record IS NULL THEN
    RETURN QUERY SELECT false, 'Conquista não encontrada'::TEXT, '{}'::json;
    RETURN;
  END IF;
  
  IF achievement_record.category = 'progressive' THEN
    IF achievement_record.progress < achievement_record.next_goal_value THEN
      RETURN QUERY SELECT false, 'Conquista ainda não completada'::TEXT, '{}'::json;
      RETURN;
    END IF;
    
    IF achievement_record.completed_at IS NULL THEN
      RETURN QUERY SELECT false, 'Conquista ainda não está pronta para coleta'::TEXT, '{}'::json;
      RETURN;
    END IF;
    
    IF achievement_record.rewards_claimed AND achievement_record.completed_at IS NOT NULL THEN
      RETURN QUERY SELECT false, 'Recompensas já coletadas para este nível'::TEXT, '{}'::json;
      RETURN;
    END IF;
  ELSE
    IF NOT achievement_record.is_completed OR achievement_record.rewards_claimed THEN
      RETURN QUERY SELECT false, 'Conquista não encontrada ou já coletada'::TEXT, '{}'::json;
      RETURN;
    END IF;
  END IF;
  
  reward_coins := achievement_record.base_reward_coins;
  reward_xp := achievement_record.base_reward_xp;
  reward_shards := achievement_record.base_reward_shards;
  reward_spins := achievement_record.base_reward_spins;
  
  IF achievement_record.category = 'progressive' THEN
    reward_shards := reward_shards + (achievement_record.completed_count * achievement_record.reward_increment);
  END IF;
  
  IF achievement_record.category = 'progressive' THEN
    UPDATE public.user_achievements 
    SET completed_count = completed_count + 1,
        next_goal_value = next_goal_value + achievement_record.increment_step,
        completed_at = NULL,
        rewards_claimed = false,
        updated_at = now()
    WHERE user_id = p_user_id AND achievement_id = p_achievement_id;
  ELSE
    UPDATE public.user_achievements 
    SET rewards_claimed = true, updated_at = now()
    WHERE user_id = p_user_id AND achievement_id = p_achievement_id;
  END IF;
  
  UPDATE public.profiles 
  SET 
    pokecoins = pokecoins + reward_coins,
    pokeshards = pokeshards + reward_shards,
    updated_at = now()
  WHERE user_id = p_user_id;
  
  IF reward_xp > 0 THEN
    SELECT * INTO xp_result FROM add_experience(p_user_id, reward_xp);
  END IF;
  
  IF reward_spins > 0 THEN
    UPDATE public.user_spins 
    SET free_spins = free_spins + reward_spins, updated_at = now()
    WHERE user_id = p_user_id;
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

-- Fix claim_daily_completion_bonus
CREATE OR REPLACE FUNCTION public.claim_daily_completion_bonus(p_user_id uuid)
 RETURNS TABLE(success boolean, message text, rewards json)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  daily_missions_count INTEGER;
  completed_daily_missions_count INTEGER;
  already_claimed BOOLEAN := false;
  xp_result RECORD;
BEGIN
  IF p_user_id != auth.uid() THEN
    RETURN QUERY SELECT false, 'Unauthorized: cannot modify another user''s data'::TEXT, '{}'::json;
    RETURN;
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM public.user_missions
    WHERE user_id = p_user_id 
    AND daily_bonus_claimed_at::date = CURRENT_DATE
  ) INTO already_claimed;
  
  IF already_claimed THEN
    RETURN QUERY SELECT false, 'Bônus diário já foi coletado hoje'::TEXT, '{}'::json;
    RETURN;
  END IF;
  
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
  
  IF completed_daily_missions_count < daily_missions_count THEN
    RETURN QUERY SELECT false, 'Nem todas as missões diárias foram completadas e coletadas'::TEXT, '{}'::json;
    RETURN;
  END IF;
  
  UPDATE public.profiles 
  SET 
    pokecoins = pokecoins + 15,
    pokeshards = pokeshards + 15,
    updated_at = now()
  WHERE user_id = p_user_id;
  
  SELECT * INTO xp_result FROM add_experience(p_user_id, 100);
  
  UPDATE public.user_missions 
  SET daily_bonus_claimed_at = now()
  WHERE user_id = p_user_id 
  AND mission_id = (
    SELECT mission_id FROM public.user_missions 
    WHERE user_id = p_user_id 
    LIMIT 1
  );
  
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

-- Fix claim_weekly_completion_bonus
CREATE OR REPLACE FUNCTION public.claim_weekly_completion_bonus(p_user_id uuid)
 RETURNS TABLE(success boolean, message text, rewards json)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  weekly_missions_count INTEGER;
  completed_weekly_missions_count INTEGER;
  already_claimed BOOLEAN := false;
  xp_result RECORD;
BEGIN
  IF p_user_id != auth.uid() THEN
    RETURN QUERY SELECT false, 'Unauthorized: cannot modify another user''s data'::TEXT, '{}'::json;
    RETURN;
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM public.user_missions
    WHERE user_id = p_user_id 
    AND weekly_bonus_claimed_at >= date_trunc('week', CURRENT_DATE)
    AND weekly_bonus_claimed_at < date_trunc('week', CURRENT_DATE) + interval '7 days'
  ) INTO already_claimed;
  
  IF already_claimed THEN
    RETURN QUERY SELECT false, 'Bônus semanal já foi coletado esta semana'::TEXT, '{}'::json;
    RETURN;
  END IF;
  
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
  
  IF completed_weekly_missions_count < weekly_missions_count THEN
    RETURN QUERY SELECT false, 'Nem todas as missões semanais foram completadas e coletadas'::TEXT, '{}'::json;
    RETURN;
  END IF;
  
  UPDATE public.profiles 
  SET 
    pokecoins = pokecoins + 75,
    pokeshards = pokeshards + 50,
    updated_at = now()
  WHERE user_id = p_user_id;
  
  SELECT * INTO xp_result FROM add_experience(p_user_id, 250);
  
  UPDATE public.user_missions 
  SET weekly_bonus_claimed_at = now()
  WHERE user_id = p_user_id 
  AND mission_id = (
    SELECT mission_id FROM public.user_missions 
    WHERE user_id = p_user_id 
    LIMIT 1
  );
  
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

-- Fix claim_pokedex_reward
CREATE OR REPLACE FUNCTION public.claim_pokedex_reward(p_user_id uuid, p_section text, p_milestone integer, p_coins integer, p_xp integer, p_shards integer)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_already_claimed BOOLEAN;
  xp_result RECORD;
BEGIN
  IF p_user_id != auth.uid() THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Unauthorized: cannot modify another user''s data'
    );
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM pokedex_rewards_claimed
    WHERE user_id = p_user_id
    AND section = p_section
    AND milestone = p_milestone
  ) INTO v_already_claimed;

  IF v_already_claimed THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Recompensa já coletada!'
    );
  END IF;

  INSERT INTO pokedex_rewards_claimed (user_id, section, milestone)
  VALUES (p_user_id, p_section, p_milestone);

  UPDATE profiles
  SET 
    pokecoins = pokecoins + p_coins,
    pokeshards = pokeshards + p_shards,
    updated_at = now()
  WHERE user_id = p_user_id;
  
  IF p_xp > 0 THEN
    SELECT * INTO xp_result FROM add_experience(p_user_id, p_xp);
  END IF;

  RETURN json_build_object(
    'success', true,
    'message', 'Recompensa coletada com sucesso!'
  );
END;
$function$;