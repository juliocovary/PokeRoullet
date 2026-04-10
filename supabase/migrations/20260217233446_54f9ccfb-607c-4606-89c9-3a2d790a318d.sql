
-- Update get_user_clan to calculate rank dynamically
CREATE OR REPLACE FUNCTION get_user_clan(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSON;
  v_clan_id UUID;
  v_member_role TEXT;
BEGIN
  SELECT clan_id, role INTO v_clan_id, v_member_role
  FROM clan_members WHERE user_id = p_user_id;

  IF v_clan_id IS NULL THEN
    RETURN json_build_object('has_clan', false);
  END IF;

  SELECT json_build_object(
    'has_clan', true,
    'clan', json_build_object(
      'id', c.id,
      'name', c.name,
      'description', c.description,
      'emblem', c.emblem,
      'leader_id', c.leader_id,
      'min_level', c.min_level,
      'entry_type', c.entry_type,
      'max_members', c.max_members,
      'created_at', c.created_at
    ),
    'my_role', v_member_role,
    'member_count', (SELECT COUNT(*) FROM clan_members WHERE clan_id = v_clan_id),
    'season_info', (
      SELECT json_build_object(
        'total_points', css.total_points,
        'rank', (
          SELECT COUNT(*) + 1 
          FROM clan_season_scores css2 
          WHERE css2.season_id = css.season_id 
          AND css2.total_points > css.total_points
        ),
        'active_members', css.active_members,
        'season_number', cs.season_number,
        'days_remaining', EXTRACT(DAY FROM cs.end_date - now())::INTEGER
      )
      FROM clan_season_scores css
      JOIN clan_seasons cs ON cs.id = css.season_id
      WHERE css.clan_id = v_clan_id AND cs.is_active = true
    ),
    'my_contribution', (
      SELECT COALESCE(points_contributed, 0)
      FROM clan_member_contributions cmc
      JOIN clan_seasons cs ON cs.id = cmc.season_id
      WHERE cmc.clan_id = v_clan_id 
      AND cmc.user_id = p_user_id 
      AND cs.is_active = true
    )
  ) INTO v_result
  FROM clans c
  WHERE c.id = v_clan_id;

  RETURN v_result;
END;
$$;

-- Also update get_clan_rankings to calculate rank dynamically
CREATE OR REPLACE FUNCTION get_clan_rankings(p_limit INTEGER DEFAULT 50)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (
    SELECT json_agg(ranked ORDER BY ranked.rank)
    FROM (
      SELECT 
        ROW_NUMBER() OVER (ORDER BY css.total_points DESC) as rank,
        c.id as clan_id,
        c.name,
        c.emblem,
        css.total_points,
        (SELECT COUNT(*) FROM clan_members cm WHERE cm.clan_id = c.id) as member_count,
        (SELECT p.nickname FROM profiles p WHERE p.user_id = c.leader_id) as leader_nickname
      FROM clan_season_scores css
      JOIN clan_seasons cs ON cs.id = css.season_id
      JOIN clans c ON c.id = css.clan_id
      WHERE cs.is_active = true
      ORDER BY css.total_points DESC
      LIMIT p_limit
    ) ranked
  );
END;
$$;
