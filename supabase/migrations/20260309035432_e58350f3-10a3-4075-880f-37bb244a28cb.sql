
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
  v_rankings json;
  v_trainer_rankings json;
  v_clan json;
  v_trainer_team json;
  v_achievements_count integer;
  v_badges json;
BEGIN
  -- Profile basics
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

  -- Pokedex counts
  SELECT COUNT(*) INTO v_pokedex_count
  FROM pokedex_cards WHERE user_id = p_user_id;

  SELECT COUNT(*) INTO v_shiny_count
  FROM pokedex_cards WHERE user_id = p_user_id AND is_shiny = true;

  SELECT COALESCE(SUM(quantity), 0) INTO v_total_collected
  FROM pokemon_inventory WHERE user_id = p_user_id;

  -- Ranking positions
  SELECT json_build_object(
    'level_rank', r.level_rank,
    'pokedex_rank', r.pokedex_rank,
    'shiny_rank', r.shiny_rank
  ) INTO v_rankings
  FROM rankings r
  WHERE r.user_id = p_user_id;

  -- Trainer rankings
  SELECT json_build_object(
    'highest_stage', tr.highest_stage,
    'highest_stage_rank', tr.highest_stage_rank,
    'total_pokemon_defeated', tr.total_pokemon_defeated,
    'defeated_rank', tr.defeated_rank
  ) INTO v_trainer_rankings
  FROM trainer_rankings tr
  WHERE tr.user_id = p_user_id;

  -- Clan info
  SELECT json_build_object(
    'clan_name', c.name,
    'clan_emblem', c.emblem,
    'role', cm.role
  ) INTO v_clan
  FROM clan_members cm
  JOIN clans c ON c.id = cm.clan_id
  WHERE cm.user_id = p_user_id;

  -- Trainer team (top 3 pokemon + pet)
  SELECT json_build_object(
    'slot_1', CASE WHEN tt.slot_1_pokemon_id IS NOT NULL THEN (
      SELECT json_build_object('pokemon_name', tp.pokemon_name, 'pokemon_id', tp.pokemon_id, 'level', tp.level, 'power', tp.power, 'star_rating', tp.star_rating, 'is_shiny', tp.is_shiny, 'pokemon_type', tp.pokemon_type)
      FROM trainer_pokemon tp WHERE tp.id = tt.slot_1_pokemon_id
    ) ELSE NULL END,
    'slot_2', CASE WHEN tt.slot_2_pokemon_id IS NOT NULL THEN (
      SELECT json_build_object('pokemon_name', tp.pokemon_name, 'pokemon_id', tp.pokemon_id, 'level', tp.level, 'power', tp.power, 'star_rating', tp.star_rating, 'is_shiny', tp.is_shiny, 'pokemon_type', tp.pokemon_type)
      FROM trainer_pokemon tp WHERE tp.id = tt.slot_2_pokemon_id
    ) ELSE NULL END,
    'slot_3', CASE WHEN tt.slot_3_pokemon_id IS NOT NULL THEN (
      SELECT json_build_object('pokemon_name', tp.pokemon_name, 'pokemon_id', tp.pokemon_id, 'level', tp.level, 'power', tp.power, 'star_rating', tp.star_rating, 'is_shiny', tp.is_shiny, 'pokemon_type', tp.pokemon_type)
      FROM trainer_pokemon tp WHERE tp.id = tt.slot_3_pokemon_id
    ) ELSE NULL END,
    'pet_pokemon_name', tt.pet_pokemon_name,
    'pet_pokemon_id', tt.pet_pokemon_id,
    'pet_is_shiny', tt.pet_is_shiny,
    'pet_rarity', tt.pet_rarity
  ) INTO v_trainer_team
  FROM trainer_teams tt
  WHERE tt.user_id = p_user_id;

  -- Achievements completed count
  SELECT COUNT(*) INTO v_achievements_count
  FROM user_achievements ua
  WHERE ua.user_id = p_user_id AND ua.is_completed = true;

  -- Equipped badges
  SELECT json_build_object(
    'slot_1', CASE WHEN ueb.slot_1_item_id IS NOT NULL THEN (
      SELECT json_build_object('name', i.name, 'icon_url', i.icon_url, 'type', i.type)
      FROM items i WHERE i.id = ueb.slot_1_item_id
    ) ELSE NULL END,
    'slot_2', CASE WHEN ueb.slot_2_item_id IS NOT NULL THEN (
      SELECT json_build_object('name', i.name, 'icon_url', i.icon_url, 'type', i.type)
      FROM items i WHERE i.id = ueb.slot_2_item_id
    ) ELSE NULL END,
    'slot_3', CASE WHEN ueb.slot_3_item_id IS NOT NULL THEN (
      SELECT json_build_object('name', i.name, 'icon_url', i.icon_url, 'type', i.type)
      FROM items i WHERE i.id = ueb.slot_3_item_id
    ) ELSE NULL END
  ) INTO v_badges
  FROM user_equipped_badges ueb
  WHERE ueb.user_id = p_user_id;

  -- Rarest pokemon
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
    'rarest_pokemon', v_rarest_pokemon,
    'rankings', v_rankings,
    'trainer_rankings', v_trainer_rankings,
    'clan', v_clan,
    'trainer_team', v_trainer_team,
    'achievements_count', COALESCE(v_achievements_count, 0),
    'badges', v_badges
  );
END;
$$;
