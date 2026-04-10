CREATE OR REPLACE FUNCTION public.search_clans(p_search text DEFAULT NULL, p_limit integer DEFAULT 20, p_offset integer DEFAULT 0)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (
    SELECT json_agg(clan_data)
    FROM (
      SELECT json_build_object(
        'id', c.id,
        'name', c.name,
        'description', c.description,
        'emblem', c.emblem,
        'min_level', c.min_level,
        'entry_type', c.entry_type,
        'max_members', c.max_members,
        'member_count', (SELECT COUNT(*) FROM clan_members WHERE clan_id = c.id),
        'total_points', COALESCE(css.total_points, 0),
        'rank', css.rank,
        'leader_nickname', (SELECT nickname FROM profiles WHERE user_id = c.leader_id)
      ) as clan_data
      FROM clans c
      LEFT JOIN clan_seasons cs ON cs.is_active = true
      LEFT JOIN clan_season_scores css ON css.clan_id = c.id AND css.season_id = cs.id
      WHERE c.entry_type != 'invite_only'
      AND (p_search IS NULL OR c.name ILIKE '%' || p_search || '%')
      ORDER BY COALESCE(css.total_points, 0) DESC
      LIMIT p_limit OFFSET p_offset
    ) sub
  );
END;
$$;