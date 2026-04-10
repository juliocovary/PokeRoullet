
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

  SELECT COUNT(*) INTO v_pokedex_count
  FROM pokedex_cards WHERE user_id = p_user_id;

  SELECT COUNT(*) INTO v_shiny_count
  FROM pokedex_cards WHERE user_id = p_user_id AND is_shiny = true;

  SELECT COALESCE(SUM(quantity), 0) INTO v_total_collected
  FROM pokemon_inventory WHERE user_id = p_user_id;

  -- Get rarest pokemon from pokedex_cards (permanent record)
  -- Secret (mythical): Mew, Celebi, Jirachi, Arceus, Victini, Keldeo, Meloetta, Genesect, Diancie, Hoopa, Volcanion
  -- Legendary: Mewtwo, birds, beasts, Lugia, Ho-Oh, regis, Lati@s, weather trio, lake trio, creation trio, Heatran, Regigigas, Giratina, Cresselia, Deoxys, Phione, Manaphy, Darkrai, Shaymin, swords, forces, Tao trio, Kyurem, Xerneas, Yveltal, Zygarde
  SELECT json_build_object(
    'pokemon_id', pc.pokemon_id,
    'pokemon_name', pc.pokemon_name,
    'rarity', CASE
      WHEN pc.pokemon_id IN (151,251,385,493,494,647,648,649,719,720,721) THEN 'secret'
      WHEN pc.pokemon_id IN (144,145,146,150,243,244,245,249,250,377,378,379,380,381,382,383,384,386,480,481,482,483,484,485,486,487,488,489,490,491,492,638,639,640,641,642,643,644,645,646,716,717,718) THEN 'legendary'
      WHEN pc.pokemon_id IN (149,248,373,376,445,635,706) THEN 'pseudo'
      WHEN pc.pokemon_id IN (1,2,3,4,5,6,7,8,9,152,153,154,155,156,157,158,159,160,252,253,254,255,256,257,258,259,260,387,388,389,390,391,392,393,394,395,495,496,497,498,499,500,501,502,503,650,651,652,653,654,655,656,657,658) THEN 'starter'
      ELSE 'common'
    END,
    'is_shiny', pc.is_shiny
  ) INTO v_rarest_pokemon
  FROM pokedex_cards pc
  WHERE pc.user_id = p_user_id
  ORDER BY
    CASE
      WHEN pc.pokemon_id IN (151,251,385,493,494,647,648,649,719,720,721) THEN 1
      WHEN pc.pokemon_id IN (144,145,146,150,243,244,245,249,250,377,378,379,380,381,382,383,384,386,480,481,482,483,484,485,486,487,488,489,490,491,492,638,639,640,641,642,643,644,645,646,716,717,718) THEN 2
      WHEN pc.pokemon_id IN (149,248,373,376,445,635,706) THEN 3
      WHEN pc.pokemon_id IN (1,2,3,4,5,6,7,8,9,152,153,154,155,156,157,158,159,160,252,253,254,255,256,257,258,259,260,387,388,389,390,391,392,393,394,395,495,496,497,498,499,500,501,502,503,650,651,652,653,654,655,656,657,658) THEN 4
      ELSE 5
    END ASC,
    pc.is_shiny DESC,
    pc.placed_at DESC
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
