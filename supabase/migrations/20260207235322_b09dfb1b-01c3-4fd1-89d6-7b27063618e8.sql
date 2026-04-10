-- Create function to get user statistics
CREATE OR REPLACE FUNCTION get_user_statistics(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_spins', COALESCE((
      SELECT MAX(ua.progress) FROM user_achievements ua
      JOIN achievements a ON a.id = ua.achievement_id
      WHERE ua.user_id = p_user_id AND a.goal_type = 'spins'
    ), 0),
    
    'total_pokemon', COALESCE((
      SELECT SUM(quantity)::INTEGER FROM pokemon_inventory WHERE user_id = p_user_id
    ), 0),
    
    'unique_pokemon', COALESCE((
      SELECT COUNT(DISTINCT pokemon_id)::INTEGER FROM pokemon_inventory WHERE user_id = p_user_id
    ), 0),
    
    'shiny_count', COALESCE((
      SELECT SUM(quantity)::INTEGER FROM pokemon_inventory 
      WHERE user_id = p_user_id AND is_shiny = true
    ), 0),
    
    'legendary_count', COALESCE((
      SELECT SUM(quantity)::INTEGER FROM pokemon_inventory 
      WHERE user_id = p_user_id AND rarity = 'legendary'
    ), 0),
    
    'cards_sold', COALESCE((
      SELECT COUNT(*)::INTEGER FROM marketplace_listings 
      WHERE seller_id = p_user_id AND status = 'sold'
    ), 0),
    
    'cards_bought', COALESCE((
      SELECT COUNT(*)::INTEGER FROM marketplace_listings 
      WHERE buyer_id = p_user_id AND status = 'sold'
    ), 0),
    
    'total_coins_earned', COALESCE((
      SELECT SUM(price)::INTEGER FROM marketplace_listings 
      WHERE seller_id = p_user_id AND status = 'sold'
    ), 0),
    
    'friends_count', COALESCE((
      SELECT COUNT(*)::INTEGER FROM friendships 
      WHERE (requester_id = p_user_id OR addressee_id = p_user_id) 
      AND status = 'accepted'
    ), 0),
    
    'gifts_sent', COALESCE((
      SELECT COUNT(*)::INTEGER FROM friend_gifts WHERE sender_id = p_user_id
    ), 0),
    
    'gifts_received', COALESCE((
      SELECT COUNT(*)::INTEGER FROM friend_gifts WHERE receiver_id = p_user_id
    ), 0),
    
    'achievements_completed', COALESCE((
      SELECT COUNT(*)::INTEGER FROM user_achievements 
      WHERE user_id = p_user_id AND is_completed = true
    ), 0),
    
    'pokedex_placed', COALESCE((
      SELECT COUNT(*)::INTEGER FROM pokedex_cards WHERE user_id = p_user_id
    ), 0),
    
    'days_playing', COALESCE((
      SELECT EXTRACT(DAY FROM NOW() - created_at)::INTEGER 
      FROM profiles WHERE user_id = p_user_id
    ), 0),
    
    'regions_unlocked', COALESCE((
      SELECT array_length(unlocked_regions, 1) FROM profiles WHERE user_id = p_user_id
    ), 1)
  ) INTO result;
  
  RETURN result;
END;
$$;