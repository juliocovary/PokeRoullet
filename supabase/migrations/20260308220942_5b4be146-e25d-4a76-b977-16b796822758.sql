
CREATE OR REPLACE FUNCTION public.get_public_profile(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile json;
  v_rarest_pokemon json;
  v_pokedex_count integer;
  v_shiny_count integer;
  v_total_collected integer;
BEGIN
  -- Get basic profile info
  SELECT json_build_object(
    'nickname', p.nickname,
    'avatar', p.avatar,
    'level', p.level,
    'experience_points', p.experience_points,
    'starter_pokemon', p.starter_pokemon,
    'current_region', p.current_region,
    'created_at', p.created_at
  ) INTO v_profile
  FROM profiles p
  WHERE p.user_id = p_user_id;

  IF v_profile IS NULL THEN
    RETURN json_build_object('error', 'Profile not found');
  END IF;

  -- Get pokedex count
  SELECT COUNT(*) INTO v_pokedex_count
  FROM pokedex_cards
  WHERE user_id = p_user_id;

  -- Get shiny count  
  SELECT COUNT(*) INTO v_shiny_count
  FROM pokedex_cards
  WHERE user_id = p_user_id AND is_shiny = true;

  -- Get total pokemon collected
  SELECT COALESCE(SUM(quantity), 0) INTO v_total_collected
  FROM pokemon_inventory
  WHERE user_id = p_user_id;

  -- Get rarest pokemon (priority: xerelete > secret > legendary > pseudo > starter > rare > uncommon > common)
  SELECT json_build_object(
    'pokemon_id', pi.pokemon_id,
    'pokemon_name', pi.pokemon_name,
    'rarity', pi.rarity,
    'is_shiny', pi.is_shiny
  ) INTO v_rarest_pokemon
  FROM pokemon_inventory pi
  WHERE pi.user_id = p_user_id
  ORDER BY 
    CASE pi.rarity
      WHEN 'xerelete' THEN 1
      WHEN 'secret' THEN 2
      WHEN 'legendary' THEN 3
      WHEN 'pseudo' THEN 4
      WHEN 'starter' THEN 5
      WHEN 'rare' THEN 6
      WHEN 'uncommon' THEN 7
      WHEN 'common' THEN 8
      ELSE 9
    END ASC,
    pi.created_at DESC
  LIMIT 1;

  RETURN json_build_object(
    'profile', v_profile,
    'pokedex_count', v_pokedex_count,
    'shiny_count', v_shiny_count,
    'total_collected', v_total_collected,
    'rarest_pokemon', v_rarest_pokemon
  );
END;
$$;
