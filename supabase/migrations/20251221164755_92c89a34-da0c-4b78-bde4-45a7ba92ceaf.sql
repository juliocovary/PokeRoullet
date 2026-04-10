-- Add expires_at column to marketplace_listings
ALTER TABLE public.marketplace_listings 
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '5 days');

-- Update existing listings to have expires_at set (5 days from their creation)
UPDATE public.marketplace_listings 
SET expires_at = created_at + INTERVAL '5 days'
WHERE expires_at IS NULL AND status = 'active';

-- Create function to cleanup expired listings
CREATE OR REPLACE FUNCTION public.cleanup_expired_listings()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  expired_listing RECORD;
BEGIN
  -- Loop through all expired active listings
  FOR expired_listing IN 
    SELECT id, seller_id, pokemon_id, pokemon_name, rarity, is_shiny
    FROM marketplace_listings 
    WHERE status = 'active' AND expires_at < now()
  LOOP
    -- Return pokemon to seller's inventory
    INSERT INTO pokemon_inventory (user_id, pokemon_id, pokemon_name, rarity, is_shiny, quantity)
    VALUES (expired_listing.seller_id, expired_listing.pokemon_id, expired_listing.pokemon_name, expired_listing.rarity, expired_listing.is_shiny, 1)
    ON CONFLICT (user_id, pokemon_id, is_shiny)
    DO UPDATE SET quantity = pokemon_inventory.quantity + 1, created_at = NOW();
    
    -- Mark listing as expired
    UPDATE marketplace_listings
    SET status = 'expired', updated_at = NOW()
    WHERE id = expired_listing.id;
  END LOOP;
  
  RAISE LOG 'Expired listings cleanup completed at %', now();
END;
$$;

-- Modify create_marketplace_listing to enforce 3 listing limit
CREATE OR REPLACE FUNCTION public.create_marketplace_listing(p_user_id uuid, p_pokemon_id integer, p_price integer, p_is_shiny boolean DEFAULT false)
RETURNS TABLE(success boolean, message text, listing_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_quantity INTEGER;
  v_pokemon_name TEXT;
  v_rarity TEXT;
  v_nickname TEXT;
  v_new_listing_id UUID;
  v_active_listings_count INTEGER;
BEGIN
  -- Auth validation
  IF p_user_id != auth.uid() THEN
    RETURN QUERY SELECT FALSE, 'Unauthorized: cannot modify another user''s data'::TEXT, NULL::UUID;
    RETURN;
  END IF;

  -- First, cleanup any expired listings for this user (to free up slots)
  PERFORM cleanup_expired_listings();

  -- Check if user already has 3 active listings
  SELECT COUNT(*) INTO v_active_listings_count
  FROM marketplace_listings
  WHERE seller_id = p_user_id AND status = 'active';

  IF v_active_listings_count >= 3 THEN
    RETURN QUERY SELECT FALSE, 'Você já possui 3 ofertas ativas. Remova uma para criar outra.'::TEXT, NULL::UUID;
    RETURN;
  END IF;

  -- Price validation
  IF p_price < 1 OR p_price > 9999 THEN
    RETURN QUERY SELECT FALSE, 'Preço deve ser entre 1 e 9999 Pokécoins'::TEXT, NULL::UUID;
    RETURN;
  END IF;

  -- Check inventory
  SELECT quantity, pokemon_name, rarity INTO v_quantity, v_pokemon_name, v_rarity
  FROM pokemon_inventory
  WHERE user_id = p_user_id AND pokemon_id = p_pokemon_id AND is_shiny = p_is_shiny;

  IF v_quantity IS NULL OR v_quantity < 1 THEN
    RETURN QUERY SELECT FALSE, 'Você não possui este Pokémon no inventário'::TEXT, NULL::UUID;
    RETURN;
  END IF;

  -- Get seller nickname
  SELECT nickname INTO v_nickname
  FROM profiles
  WHERE user_id = p_user_id;

  -- Remove from inventory
  IF v_quantity = 1 THEN
    DELETE FROM pokemon_inventory
    WHERE user_id = p_user_id AND pokemon_id = p_pokemon_id AND is_shiny = p_is_shiny;
  ELSE
    UPDATE pokemon_inventory
    SET quantity = quantity - 1, created_at = NOW()
    WHERE user_id = p_user_id AND pokemon_id = p_pokemon_id AND is_shiny = p_is_shiny;
  END IF;

  -- Create listing with expiration date
  INSERT INTO marketplace_listings (
    seller_id, seller_nickname, pokemon_id, pokemon_name, rarity, is_shiny, price, expires_at
  ) VALUES (
    p_user_id, v_nickname, p_pokemon_id, v_pokemon_name, v_rarity, p_is_shiny, p_price, now() + INTERVAL '5 days'
  )
  RETURNING id INTO v_new_listing_id;

  RETURN QUERY SELECT TRUE, 'Oferta criada com sucesso!'::TEXT, v_new_listing_id;
END;
$$;

-- Function to get user's active listing count
CREATE OR REPLACE FUNCTION public.get_user_active_listings_count(p_user_id uuid)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- First cleanup expired listings
  PERFORM cleanup_expired_listings();
  
  SELECT COUNT(*) INTO v_count
  FROM marketplace_listings
  WHERE seller_id = p_user_id AND status = 'active';
  
  RETURN v_count;
END;
$$;