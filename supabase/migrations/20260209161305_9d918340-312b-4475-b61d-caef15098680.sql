
-- Update default max_members to 20
ALTER TABLE clans ALTER COLUMN max_members SET DEFAULT 20;

-- Recreate create_clan with cost, level 5 min, fixed 20 members
CREATE OR REPLACE FUNCTION create_clan(
  p_user_id UUID,
  p_name TEXT,
  p_description TEXT,
  p_emblem TEXT,
  p_min_level INTEGER DEFAULT 5,
  p_entry_type TEXT DEFAULT 'open',
  p_max_members INTEGER DEFAULT 20
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_clan_id UUID;
  v_user_level INTEGER;
  v_user_coins INTEGER;
  v_active_season_id UUID;
  v_cost INTEGER := 2000;
BEGIN
  -- Check if already in a clan
  IF EXISTS (SELECT 1 FROM clan_members WHERE user_id = p_user_id) THEN
    RETURN json_build_object('success', false, 'message', 'Você já está em um clã');
  END IF;

  -- Check unique name
  IF EXISTS (SELECT 1 FROM clans WHERE LOWER(name) = LOWER(p_name)) THEN
    RETURN json_build_object('success', false, 'message', 'Este nome de clã já existe');
  END IF;

  -- Get user level and coins
  SELECT level, pokecoins INTO v_user_level, v_user_coins
  FROM profiles WHERE user_id = p_user_id;

  IF v_user_level IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Perfil não encontrado');
  END IF;

  -- Minimum level 5
  IF v_user_level < 5 THEN
    RETURN json_build_object('success', false, 'message', 'Você precisa ser nível 5+ para criar um clã');
  END IF;

  -- Check coins
  IF v_user_coins < v_cost THEN
    RETURN json_build_object('success', false, 'message', 'Você precisa de 2.000 Pokecoins para criar um clã');
  END IF;

  -- Charge coins
  UPDATE profiles SET pokecoins = pokecoins - v_cost WHERE user_id = p_user_id;

  -- Create clan (always 20 max members)
  INSERT INTO clans (name, description, emblem, leader_id, min_level, entry_type, max_members)
  VALUES (p_name, p_description, p_emblem, p_user_id, GREATEST(p_min_level, 5), p_entry_type, 20)
  RETURNING id INTO v_clan_id;

  -- Add as leader
  INSERT INTO clan_members (clan_id, user_id, role)
  VALUES (v_clan_id, p_user_id, 'leader');

  -- Season score
  SELECT id INTO v_active_season_id FROM clan_seasons WHERE is_active = true LIMIT 1;
  IF v_active_season_id IS NOT NULL THEN
    INSERT INTO clan_season_scores (clan_id, season_id, total_points, active_members)
    VALUES (v_clan_id, v_active_season_id, 0, 1);
  END IF;

  RETURN json_build_object('success', true, 'message', 'Clã criado com sucesso!', 'clan_id', v_clan_id);
END;
$$;

-- Update join_clan with level 5 minimum
CREATE OR REPLACE FUNCTION join_clan(
  p_user_id UUID,
  p_clan_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_clan RECORD;
  v_member_count INTEGER;
  v_user_level INTEGER;
  v_active_season_id UUID;
BEGIN
  -- Check if already in a clan
  IF EXISTS (SELECT 1 FROM clan_members WHERE user_id = p_user_id) THEN
    RETURN json_build_object('success', false, 'message', 'Você já está em um clã');
  END IF;

  -- Get clan info
  SELECT * INTO v_clan FROM clans WHERE id = p_clan_id;
  IF v_clan IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Clã não encontrado');
  END IF;

  -- Get user level
  SELECT level INTO v_user_level FROM profiles WHERE user_id = p_user_id;
  IF v_user_level IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Perfil não encontrado');
  END IF;

  -- Level 5 minimum to join any clan
  IF v_user_level < 5 THEN
    RETURN json_build_object('success', false, 'message', 'Você precisa ser nível 5+ para entrar em um clã');
  END IF;

  -- Check user level vs clan min level
  IF v_user_level < v_clan.min_level THEN
    RETURN json_build_object('success', false, 'message', 'Seu nível é insuficiente para este clã');
  END IF;

  -- Check member count
  SELECT COUNT(*) INTO v_member_count FROM clan_members WHERE clan_id = p_clan_id;
  IF v_member_count >= v_clan.max_members THEN
    RETURN json_build_object('success', false, 'message', 'O clã está cheio');
  END IF;

  -- Handle entry type
  IF v_clan.entry_type = 'invite_only' THEN
    RETURN json_build_object('success', false, 'message', 'Este clã aceita apenas convites');
  END IF;

  IF v_clan.entry_type = 'approval' THEN
    -- Create join request
    INSERT INTO clan_join_requests (clan_id, user_id)
    VALUES (p_clan_id, p_user_id)
    ON CONFLICT DO NOTHING;
    
    RETURN json_build_object('success', true, 'message', 'Solicitação enviada! Aguarde aprovação.');
  END IF;

  -- Open entry - add directly
  INSERT INTO clan_members (clan_id, user_id, role)
  VALUES (p_clan_id, p_user_id, 'member');

  -- Update season score
  SELECT id INTO v_active_season_id FROM clan_seasons WHERE is_active = true LIMIT 1;
  IF v_active_season_id IS NOT NULL THEN
    UPDATE clan_season_scores 
    SET active_members = active_members + 1
    WHERE clan_id = p_clan_id AND season_id = v_active_season_id;
  END IF;

  RETURN json_build_object('success', true, 'message', 'Você entrou no clã!');
END;
$$;
