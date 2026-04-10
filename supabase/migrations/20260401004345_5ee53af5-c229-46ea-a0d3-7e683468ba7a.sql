
-- ============================================
-- CARD PACK SYSTEM - TABLES
-- ============================================

-- Pack types definition table
CREATE TABLE public.pack_types (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  card_count integer NOT NULL DEFAULT 1,
  rarity_weights jsonb NOT NULL DEFAULT '{}',
  shiny_chance numeric NOT NULL DEFAULT 0,
  drop_chance numeric NOT NULL DEFAULT 0,
  pack_category text NOT NULL DEFAULT 'drop',
  region text,
  icon_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.pack_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Pack types viewable by everyone" ON public.pack_types FOR SELECT USING (true);

-- User pack inventory
CREATE TABLE public.user_packs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pack_type_id text NOT NULL REFERENCES public.pack_types(id),
  quantity integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, pack_type_id)
);

ALTER TABLE public.user_packs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own packs" ON public.user_packs FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Track which starter packs have been opened per region
CREATE TABLE public.user_starter_packs_opened (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  region text NOT NULL,
  pokemon_id integer NOT NULL,
  pokemon_name text NOT NULL,
  opened_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, region)
);

ALTER TABLE public.user_starter_packs_opened ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own starter history" ON public.user_starter_packs_opened FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- ============================================
-- SEED DATA - Pack Types
-- ============================================

-- Starter packs (one per region)
INSERT INTO public.pack_types (id, name, description, card_count, rarity_weights, shiny_chance, drop_chance, pack_category, region) VALUES
('starter_kanto', 'Starter Pack Kanto', 'Pacote inicial da região de Kanto', 1, '{"starter": 100}', 0, 0, 'starter', 'kanto'),
('starter_johto', 'Starter Pack Johto', 'Pacote inicial da região de Johto', 1, '{"starter": 100}', 0, 0, 'starter', 'johto'),
('starter_hoenn', 'Starter Pack Hoenn', 'Pacote inicial da região de Hoenn', 1, '{"starter": 100}', 0, 0, 'starter', 'hoenn'),
('starter_sinnoh', 'Starter Pack Sinnoh', 'Pacote inicial da região de Sinnoh', 1, '{"starter": 100}', 0, 0, 'starter', 'sinnoh'),
('starter_unova', 'Starter Pack Unova', 'Pacote inicial da região de Unova', 1, '{"starter": 100}', 0, 0, 'starter', 'unova'),
('starter_kalos', 'Starter Pack Kalos', 'Pacote inicial da região de Kalos', 1, '{"starter": 100}', 0, 0, 'starter', 'kalos'),
('starter_alola', 'Starter Pack Alola', 'Pacote inicial da região de Alola', 1, '{"starter": 100}', 0, 0, 'starter', 'alola');

-- Drop packs
INSERT INTO public.pack_types (id, name, description, card_count, rarity_weights, shiny_chance, drop_chance, pack_category) VALUES
('brasa_comum', 'Pack Brasa Comum', 'Um pacote básico com Pokémon comuns', 5, '{"common": 72, "uncommon": 22, "rare": 5, "pseudo": 1, "legendary": 0, "secret": 0}', 0.35, 1, 'drop'),
('aurora_incomum', 'Pack Aurora Incomum', 'Um pacote com chances melhores de Pokémon incomuns', 5, '{"common": 50, "uncommon": 33, "rare": 12, "pseudo": 4.5, "legendary": 0.5, "secret": 0}', 0.6, 0.65, 'drop'),
('prisma_raro', 'Pack Prisma Raro', 'Um pacote com boas chances de Pokémon raros', 5, '{"common": 30, "uncommon": 35, "rare": 23, "pseudo": 10, "legendary": 2, "secret": 0}', 1, 0.30, 'drop'),
('eclipse_epico', 'Pack Eclipse Épico', 'Um pacote épico com chances elevadas', 5, '{"common": 14, "uncommon": 30, "rare": 30, "pseudo": 20, "legendary": 5.8, "secret": 0.2}', 1.6, 0.075, 'drop'),
('reliquia_lendaria', 'Pack Relíquia Lendária', 'Um pacote lendário com as melhores chances', 5, '{"common": 5, "uncommon": 18, "rare": 32, "pseudo": 28, "legendary": 16.5, "secret": 0.5}', 2.4, 0.015, 'drop'),
('secreto_ruina', 'Pack Secreto Ruína Ancestral', 'O pacote mais raro do jogo - contém um Pokémon Secreto garantido', 1, '{"common": 0, "uncommon": 0, "rare": 0, "pseudo": 0, "legendary": 0, "secret": 100}', 2, 0.0025, 'secret');

-- ============================================
-- RPC: open_starter_pack
-- ============================================
CREATE OR REPLACE FUNCTION public.open_starter_pack(p_user_id uuid, p_region text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_starters jsonb;
  v_starter jsonb;
  v_pokemon_id integer;
  v_pokemon_name text;
  v_rarity text;
  v_random_index integer;
  v_already_opened boolean;
  v_has_starter boolean;
BEGIN
  -- Validate user
  IF p_user_id != auth.uid() THEN
    RETURN jsonb_build_object('success', false, 'message', 'Unauthorized');
  END IF;

  -- Check if already opened for this region
  SELECT EXISTS(
    SELECT 1 FROM user_starter_packs_opened 
    WHERE user_id = p_user_id AND region = p_region
  ) INTO v_already_opened;

  IF v_already_opened THEN
    RETURN jsonb_build_object('success', false, 'message', 'Starter pack already opened for this region');
  END IF;

  -- For Kanto, also check if starter_pokemon is already set
  IF p_region = 'kanto' THEN
    SELECT (starter_pokemon IS NOT NULL) INTO v_has_starter
    FROM profiles WHERE user_id = p_user_id;
    
    IF v_has_starter THEN
      RETURN jsonb_build_object('success', false, 'message', 'Starter already selected');
    END IF;
  END IF;

  -- Define starters per region
  v_starters := CASE p_region
    WHEN 'kanto' THEN '[{"id": 1, "name": "bulbasaur", "rarity": "starter"}, {"id": 4, "name": "charmander", "rarity": "starter"}, {"id": 7, "name": "squirtle", "rarity": "starter"}]'::jsonb
    WHEN 'johto' THEN '[{"id": 152, "name": "chikorita", "rarity": "starter"}, {"id": 155, "name": "cyndaquil", "rarity": "starter"}, {"id": 158, "name": "totodile", "rarity": "starter"}]'::jsonb
    WHEN 'hoenn' THEN '[{"id": 252, "name": "treecko", "rarity": "starter"}, {"id": 255, "name": "torchic", "rarity": "starter"}, {"id": 258, "name": "mudkip", "rarity": "starter"}]'::jsonb
    WHEN 'sinnoh' THEN '[{"id": 387, "name": "turtwig", "rarity": "starter"}, {"id": 390, "name": "chimchar", "rarity": "starter"}, {"id": 393, "name": "piplup", "rarity": "starter"}]'::jsonb
    WHEN 'unova' THEN '[{"id": 495, "name": "snivy", "rarity": "starter"}, {"id": 498, "name": "tepig", "rarity": "starter"}, {"id": 501, "name": "oshawott", "rarity": "starter"}]'::jsonb
    WHEN 'kalos' THEN '[{"id": 650, "name": "chespin", "rarity": "starter"}, {"id": 653, "name": "fennekin", "rarity": "starter"}, {"id": 656, "name": "froakie", "rarity": "starter"}]'::jsonb
    WHEN 'alola' THEN '[{"id": 722, "name": "rowlet", "rarity": "starter"}, {"id": 725, "name": "litten", "rarity": "starter"}, {"id": 728, "name": "popplio", "rarity": "starter"}]'::jsonb
    ELSE NULL
  END;

  IF v_starters IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Invalid region');
  END IF;

  -- Random pick (0, 1, or 2)
  v_random_index := floor(random() * 3)::integer;
  v_starter := v_starters->v_random_index;
  v_pokemon_id := (v_starter->>'id')::integer;
  v_pokemon_name := v_starter->>'name';
  v_rarity := v_starter->>'rarity';

  -- Add to pokemon_inventory
  INSERT INTO pokemon_inventory (user_id, pokemon_id, pokemon_name, rarity, quantity, is_shiny)
  VALUES (p_user_id, v_pokemon_id, v_pokemon_name, v_rarity, 1, false)
  ON CONFLICT (user_id, pokemon_id, is_shiny) 
  DO UPDATE SET quantity = pokemon_inventory.quantity + 1;

  -- For Kanto, set starter_pokemon on profile
  IF p_region = 'kanto' THEN
    UPDATE profiles SET starter_pokemon = v_pokemon_name, updated_at = now()
    WHERE user_id = p_user_id;
  END IF;

  -- Record the opening
  INSERT INTO user_starter_packs_opened (user_id, region, pokemon_id, pokemon_name)
  VALUES (p_user_id, p_region, v_pokemon_id, v_pokemon_name);

  -- Grant XP for opening starter pack
  UPDATE profiles SET experience_points = experience_points + 100, updated_at = now()
  WHERE user_id = p_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'pokemon_id', v_pokemon_id,
    'pokemon_name', v_pokemon_name,
    'rarity', v_rarity,
    'is_shiny', false,
    'region', p_region
  );
END;
$$;

-- ============================================
-- RPC: open_card_pack
-- ============================================
CREATE OR REPLACE FUNCTION public.open_card_pack(p_user_id uuid, p_pack_type_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pack_type record;
  v_user_pack record;
  v_results jsonb := '[]'::jsonb;
  v_card_index integer;
  v_roll numeric;
  v_cumulative numeric;
  v_selected_rarity text;
  v_rarity_key text;
  v_rarity_value numeric;
  v_pokemon record;
  v_is_shiny boolean;
  v_shiny_roll numeric;
  v_unlocked_regions text[];
  v_region_pokemon_ids integer[];
  v_all_pokemon_for_rarity integer[];
BEGIN
  -- Validate user
  IF p_user_id != auth.uid() THEN
    RETURN jsonb_build_object('success', false, 'message', 'Unauthorized');
  END IF;

  -- Get pack type config
  SELECT * INTO v_pack_type FROM pack_types WHERE id = p_pack_type_id;
  IF v_pack_type IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Invalid pack type');
  END IF;

  -- Check user has this pack
  SELECT * INTO v_user_pack FROM user_packs 
  WHERE user_id = p_user_id AND pack_type_id = p_pack_type_id AND quantity > 0;
  
  IF v_user_pack IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'No packs available');
  END IF;

  -- Decrement pack quantity
  UPDATE user_packs SET quantity = quantity - 1, updated_at = now()
  WHERE id = v_user_pack.id;

  -- Delete if quantity reaches 0
  DELETE FROM user_packs WHERE id = v_user_pack.id AND quantity <= 0;

  -- Get user unlocked regions to determine pokemon pool
  SELECT unlocked_regions INTO v_unlocked_regions FROM profiles WHERE user_id = p_user_id;

  -- Roll each card
  FOR v_card_index IN 1..v_pack_type.card_count LOOP
    -- Roll rarity
    v_roll := random() * 100;
    v_cumulative := 0;
    v_selected_rarity := 'common';
    
    FOR v_rarity_key, v_rarity_value IN SELECT key, value::numeric FROM jsonb_each_text(v_pack_type.rarity_weights) LOOP
      v_cumulative := v_cumulative + v_rarity_value;
      IF v_roll <= v_cumulative THEN
        v_selected_rarity := v_rarity_key;
        EXIT;
      END IF;
    END LOOP;

    -- Map pack rarity names to actual DB rarity values
    -- "pseudo" in pack weights maps to "pseudo" rarity (epic tier)
    -- The pack weights use: common, uncommon, rare, pseudo (epic), legendary, secret

    -- Pick random pokemon of that rarity from inventory pool
    -- We use pokemon_id ranges based on unlocked regions
    SELECT pokemon_id, pokemon_name INTO v_pokemon
    FROM (
      SELECT pi2.pokemon_id, pi2.pokemon_name
      FROM pokemon_inventory pi2
      WHERE pi2.user_id = p_user_id AND pi2.rarity = v_selected_rarity
      UNION
      SELECT pokemon_id, pokemon_name FROM (VALUES
        -- Fallback: provide some pokemon per rarity if user has none
        (10, 'caterpie'), (13, 'weedle'), (16, 'pidgey'), (19, 'rattata')
      ) AS fallback(pokemon_id, pokemon_name)
      WHERE v_selected_rarity = 'common'
    ) candidates
    ORDER BY random()
    LIMIT 1;

    -- If no pokemon found, default to a common one
    IF v_pokemon IS NULL THEN
      v_pokemon := ROW(10, 'caterpie')::record;
    END IF;

    -- Roll shiny
    v_shiny_roll := random() * 100;
    v_is_shiny := v_shiny_roll < v_pack_type.shiny_chance;

    -- Add to pokemon inventory
    INSERT INTO pokemon_inventory (user_id, pokemon_id, pokemon_name, rarity, quantity, is_shiny)
    VALUES (p_user_id, v_pokemon.pokemon_id, v_pokemon.pokemon_name, v_selected_rarity, 1, v_is_shiny)
    ON CONFLICT (user_id, pokemon_id, is_shiny)
    DO UPDATE SET quantity = pokemon_inventory.quantity + 1;

    -- Append result
    v_results := v_results || jsonb_build_object(
      'pokemon_id', v_pokemon.pokemon_id,
      'pokemon_name', v_pokemon.pokemon_name,
      'rarity', v_selected_rarity,
      'is_shiny', v_is_shiny
    );
  END LOOP;

  RETURN jsonb_build_object('success', true, 'cards', v_results);
END;
$$;

-- ============================================
-- RPC: grant_pack_drop
-- ============================================
CREATE OR REPLACE FUNCTION public.grant_pack_drop(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pack record;
  v_roll numeric;
  v_drops jsonb := '[]'::jsonb;
BEGIN
  -- Validate user
  IF p_user_id != auth.uid() THEN
    RETURN jsonb_build_object('success', false, 'drops', '[]'::jsonb);
  END IF;

  -- Roll against each droppable pack type
  FOR v_pack IN SELECT id, name, drop_chance FROM pack_types WHERE drop_chance > 0 ORDER BY drop_chance ASC LOOP
    v_roll := random() * 100;
    
    IF v_roll < v_pack.drop_chance THEN
      -- Grant pack
      INSERT INTO user_packs (user_id, pack_type_id, quantity)
      VALUES (p_user_id, v_pack.id, 1)
      ON CONFLICT (user_id, pack_type_id)
      DO UPDATE SET quantity = user_packs.quantity + 1, updated_at = now();

      v_drops := v_drops || jsonb_build_object('pack_id', v_pack.id, 'pack_name', v_pack.name);
    END IF;
  END LOOP;

  RETURN jsonb_build_object('success', true, 'drops', v_drops);
END;
$$;
