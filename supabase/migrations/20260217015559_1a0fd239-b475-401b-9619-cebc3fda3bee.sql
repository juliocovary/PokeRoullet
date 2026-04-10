
-- Update add_clan_points to support incrementing mission progress by a custom amount
-- Add optional p_count parameter (defaults to 1 for backward compatibility)
CREATE OR REPLACE FUNCTION public.add_clan_points(p_user_id UUID, p_points INTEGER, p_activity_type TEXT, p_count INTEGER DEFAULT 1)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_clan_id UUID;
  v_season_id UUID;
  v_bonus_multiplier NUMERIC := 1.0;
  v_active_members INTEGER;
  v_final_points INTEGER;
  v_mission_type TEXT;
BEGIN
  SELECT clan_id INTO v_clan_id FROM clan_members WHERE user_id = p_user_id;
  IF v_clan_id IS NULL THEN RETURN false; END IF;

  SELECT id INTO v_season_id FROM clan_seasons WHERE is_active = true LIMIT 1;
  IF v_season_id IS NULL THEN RETURN false; END IF;

  SELECT active_members INTO v_active_members 
  FROM clan_season_scores 
  WHERE clan_id = v_clan_id AND season_id = v_season_id;

  IF v_active_members >= 20 THEN
    v_bonus_multiplier := 1.2;
  ELSIF v_active_members >= 10 THEN
    v_bonus_multiplier := 1.1;
  END IF;

  v_final_points := FLOOR(p_points * v_bonus_multiplier);

  INSERT INTO clan_season_scores (clan_id, season_id, total_points, active_members)
  VALUES (v_clan_id, v_season_id, v_final_points, 1)
  ON CONFLICT (clan_id, season_id) 
  DO UPDATE SET 
    total_points = clan_season_scores.total_points + v_final_points,
    updated_at = now();

  INSERT INTO clan_member_contributions (clan_id, user_id, season_id, points_contributed, last_contribution_at)
  VALUES (v_clan_id, p_user_id, v_season_id, v_final_points, now())
  ON CONFLICT (clan_id, user_id, season_id)
  DO UPDATE SET 
    points_contributed = clan_member_contributions.points_contributed + v_final_points,
    last_contribution_at = now(),
    updated_at = now();

  v_mission_type := CASE p_activity_type
    WHEN 'spin' THEN 'total_spins'
    WHEN 'shiny_catch' THEN 'shiny_catches'
    WHEN 'legendary_catch' THEN 'rare_catches'
    WHEN 'rare_catch' THEN 'rare_catches'
    WHEN 'sell' THEN 'total_sells'
    WHEN 'daily_mission' THEN 'missions_completed'
    WHEN 'weekly_mission' THEN 'missions_completed'
    WHEN 'trainer_enemies' THEN 'trainer_enemies_defeated'
    ELSE NULL
  END;

  IF v_mission_type IS NOT NULL THEN
    INSERT INTO clan_mission_progress (clan_id, mission_id, season_id, current_progress, is_completed, completed_at)
    SELECT v_clan_id, cm.id, v_season_id, p_count, false, NULL
    FROM clan_collective_missions cm
    WHERE cm.mission_type = v_mission_type
    ON CONFLICT (clan_id, mission_id, season_id)
    DO UPDATE SET 
      current_progress = clan_mission_progress.current_progress + p_count,
      is_completed = CASE 
        WHEN clan_mission_progress.current_progress + p_count >= (
          SELECT goal FROM clan_collective_missions WHERE id = clan_mission_progress.mission_id
        ) THEN true ELSE false END,
      completed_at = CASE 
        WHEN clan_mission_progress.current_progress + p_count >= (
          SELECT goal FROM clan_collective_missions WHERE id = clan_mission_progress.mission_id
        ) THEN now() ELSE NULL END;
  END IF;

  RETURN true;
END;
$$;
