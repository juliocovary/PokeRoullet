
-- RPC to update clan settings (leader only)
CREATE OR REPLACE FUNCTION update_clan_settings(
  p_user_id UUID,
  p_clan_id UUID,
  p_description TEXT DEFAULT NULL,
  p_emblem TEXT DEFAULT NULL,
  p_entry_type TEXT DEFAULT NULL,
  p_min_level INTEGER DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role FROM clan_members WHERE user_id = p_user_id AND clan_id = p_clan_id;
  
  IF v_role IS NULL OR v_role NOT IN ('leader', 'vice_leader') THEN
    RETURN json_build_object('success', false, 'message', 'Apenas líderes podem alterar configurações');
  END IF;

  UPDATE clans SET
    description = COALESCE(p_description, description),
    emblem = COALESCE(p_emblem, emblem),
    entry_type = COALESCE(p_entry_type, entry_type),
    min_level = COALESCE(p_min_level, min_level),
    updated_at = now()
  WHERE id = p_clan_id;

  RETURN json_build_object('success', true, 'message', 'Configurações atualizadas com sucesso');
END;
$$;

-- RPC to promote/demote/kick members (leader only)
CREATE OR REPLACE FUNCTION manage_clan_member(
  p_user_id UUID,
  p_target_user_id UUID,
  p_clan_id UUID,
  p_action TEXT -- 'promote', 'demote', 'kick'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role TEXT;
  v_target_role TEXT;
BEGIN
  SELECT role INTO v_role FROM clan_members WHERE user_id = p_user_id AND clan_id = p_clan_id;
  
  IF v_role != 'leader' THEN
    RETURN json_build_object('success', false, 'message', 'Apenas o líder pode gerenciar membros');
  END IF;

  IF p_user_id = p_target_user_id THEN
    RETURN json_build_object('success', false, 'message', 'Você não pode gerenciar a si mesmo');
  END IF;

  SELECT role INTO v_target_role FROM clan_members WHERE user_id = p_target_user_id AND clan_id = p_clan_id;
  
  IF v_target_role IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Membro não encontrado');
  END IF;

  IF p_action = 'promote' THEN
    IF v_target_role = 'member' THEN
      UPDATE clan_members SET role = 'vice_leader', updated_at = now() WHERE user_id = p_target_user_id AND clan_id = p_clan_id;
      RETURN json_build_object('success', true, 'message', 'Membro promovido a Vice-Líder');
    ELSE
      RETURN json_build_object('success', false, 'message', 'Membro já é Vice-Líder');
    END IF;
  ELSIF p_action = 'demote' THEN
    IF v_target_role = 'vice_leader' THEN
      UPDATE clan_members SET role = 'member', updated_at = now() WHERE user_id = p_target_user_id AND clan_id = p_clan_id;
      RETURN json_build_object('success', true, 'message', 'Vice-Líder rebaixado a Membro');
    ELSE
      RETURN json_build_object('success', false, 'message', 'Membro não pode ser rebaixado');
    END IF;
  ELSIF p_action = 'kick' THEN
    DELETE FROM clan_members WHERE user_id = p_target_user_id AND clan_id = p_clan_id;
    DELETE FROM clan_member_contributions WHERE user_id = p_target_user_id AND clan_id = p_clan_id;
    RETURN json_build_object('success', true, 'message', 'Membro expulso do clã');
  ELSE
    RETURN json_build_object('success', false, 'message', 'Ação inválida');
  END IF;
END;
$$;
