-- Fix search_path for the new functions
ALTER FUNCTION get_unread_news_count(uuid) SET search_path = public;
ALTER FUNCTION get_friends_stats_batch(uuid, uuid[]) SET search_path = public;