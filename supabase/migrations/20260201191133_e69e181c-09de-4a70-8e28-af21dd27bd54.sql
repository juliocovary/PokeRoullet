-- RPC function to get unread news count (single lightweight query)
CREATE OR REPLACE FUNCTION get_unread_news_count(p_user_id uuid)
RETURNS int AS $$
  SELECT COUNT(*)::int 
  FROM news_articles na
  WHERE na.is_active = true
    AND NOT EXISTS (
      SELECT 1 FROM news_read_status nrs 
      WHERE nrs.article_id = na.id AND nrs.user_id = p_user_id
    );
$$ LANGUAGE sql SECURITY DEFINER;

-- RPC function to get friends stats in batch (reduces N+1 queries)
CREATE OR REPLACE FUNCTION get_friends_stats_batch(p_user_id uuid, p_friend_ids uuid[])
RETURNS TABLE(
  friend_id uuid, 
  pokemon_count int, 
  unique_pokemon_count int,
  can_send_gift boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    friend.id AS friend_id,
    COALESCE(SUM(pi.quantity)::int, 0) AS pokemon_count,
    COALESCE(COUNT(pi.id)::int, 0) AS unique_pokemon_count,
    NOT EXISTS (
      SELECT 1 FROM friend_gifts fg
      WHERE fg.sender_id = p_user_id 
        AND fg.receiver_id = friend.id
        AND fg.sent_at::date = CURRENT_DATE
    ) AS can_send_gift
  FROM unnest(p_friend_ids) AS friend(id)
  LEFT JOIN pokemon_inventory pi ON pi.user_id = friend.id
  GROUP BY friend.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;