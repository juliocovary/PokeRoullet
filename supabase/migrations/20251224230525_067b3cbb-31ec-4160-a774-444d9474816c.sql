-- Create SECURITY DEFINER function for selecting starter Pokemon
CREATE OR REPLACE FUNCTION public.select_starter_pokemon(
  p_user_id UUID,
  p_pokemon_id INTEGER,
  p_pokemon_name TEXT,
  p_rarity TEXT
)
RETURNS TABLE(success BOOLEAN, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing_starter TEXT;
BEGIN
  -- Auth validation
  IF p_user_id != auth.uid() THEN
    RETURN QUERY SELECT FALSE, 'Unauthorized: cannot modify another user''s data'::TEXT;
    RETURN;
  END IF;

  -- Check if user already has a starter
  SELECT starter_pokemon INTO v_existing_starter
  FROM profiles
  WHERE user_id = p_user_id;

  IF v_existing_starter IS NOT NULL THEN
    RETURN QUERY SELECT FALSE, 'Você já selecionou um Pokémon inicial'::TEXT;
    RETURN;
  END IF;

  -- Update profile with starter selection
  UPDATE profiles
  SET starter_pokemon = p_pokemon_name, updated_at = now()
  WHERE user_id = p_user_id;

  -- Add Pokemon to inventory
  INSERT INTO pokemon_inventory (user_id, pokemon_id, pokemon_name, rarity, quantity, is_shiny)
  VALUES (p_user_id, p_pokemon_id, p_pokemon_name, p_rarity, 1, false)
  ON CONFLICT (user_id, pokemon_id, is_shiny)
  DO UPDATE SET quantity = pokemon_inventory.quantity + 1, created_at = now();

  RETURN QUERY SELECT TRUE, 'Pokémon inicial selecionado com sucesso!'::TEXT;
END;
$$;

-- Create SECURITY DEFINER function for sending friend request
CREATE OR REPLACE FUNCTION public.send_friend_request(
  p_user_id UUID,
  p_friend_id UUID
)
RETURNS TABLE(success BOOLEAN, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing_friendship RECORD;
BEGIN
  -- Auth validation
  IF p_user_id != auth.uid() THEN
    RETURN QUERY SELECT FALSE, 'Unauthorized: cannot modify another user''s data'::TEXT;
    RETURN;
  END IF;

  -- Prevent self-friending
  IF p_user_id = p_friend_id THEN
    RETURN QUERY SELECT FALSE, 'Você não pode adicionar a si mesmo como amigo'::TEXT;
    RETURN;
  END IF;

  -- Check if friendship already exists (in either direction)
  SELECT * INTO v_existing_friendship
  FROM friendships
  WHERE (requester_id = p_user_id AND addressee_id = p_friend_id)
     OR (requester_id = p_friend_id AND addressee_id = p_user_id);

  IF FOUND THEN
    IF v_existing_friendship.status = 'pending' THEN
      RETURN QUERY SELECT FALSE, 'Já existe um pedido de amizade pendente'::TEXT;
    ELSIF v_existing_friendship.status = 'accepted' THEN
      RETURN QUERY SELECT FALSE, 'Vocês já são amigos'::TEXT;
    ELSIF v_existing_friendship.status = 'blocked' THEN
      RETURN QUERY SELECT FALSE, 'Não é possível enviar pedido de amizade'::TEXT;
    ELSE
      RETURN QUERY SELECT FALSE, 'Pedido de amizade já processado'::TEXT;
    END IF;
    RETURN;
  END IF;

  -- Insert new friend request
  INSERT INTO friendships (requester_id, addressee_id, status)
  VALUES (p_user_id, p_friend_id, 'pending');

  RETURN QUERY SELECT TRUE, 'Pedido de amizade enviado com sucesso!'::TEXT;
END;
$$;

-- Create SECURITY DEFINER function for responding to friend request
CREATE OR REPLACE FUNCTION public.respond_to_friend_request(
  p_user_id UUID,
  p_friendship_id UUID,
  p_accept BOOLEAN
)
RETURNS TABLE(success BOOLEAN, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_friendship RECORD;
BEGIN
  -- Auth validation
  IF p_user_id != auth.uid() THEN
    RETURN QUERY SELECT FALSE, 'Unauthorized: cannot modify another user''s data'::TEXT;
    RETURN;
  END IF;

  -- Get friendship and verify user is the addressee
  SELECT * INTO v_friendship
  FROM friendships
  WHERE id = p_friendship_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 'Pedido de amizade não encontrado'::TEXT;
    RETURN;
  END IF;

  -- Only the addressee can respond to the request
  IF v_friendship.addressee_id != p_user_id THEN
    RETURN QUERY SELECT FALSE, 'Você não tem permissão para responder este pedido'::TEXT;
    RETURN;
  END IF;

  IF v_friendship.status != 'pending' THEN
    RETURN QUERY SELECT FALSE, 'Este pedido já foi processado'::TEXT;
    RETURN;
  END IF;

  -- Update friendship status
  UPDATE friendships
  SET status = CASE WHEN p_accept THEN 'accepted' ELSE 'declined' END,
      updated_at = now()
  WHERE id = p_friendship_id;

  IF p_accept THEN
    RETURN QUERY SELECT TRUE, 'Amizade aceita! Vocês agora são amigos.'::TEXT;
  ELSE
    RETURN QUERY SELECT TRUE, 'Pedido de amizade recusado.'::TEXT;
  END IF;
END;
$$;

-- Create SECURITY DEFINER function for removing friend
CREATE OR REPLACE FUNCTION public.remove_friend(
  p_user_id UUID,
  p_friendship_id UUID
)
RETURNS TABLE(success BOOLEAN, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_friendship RECORD;
BEGIN
  -- Auth validation
  IF p_user_id != auth.uid() THEN
    RETURN QUERY SELECT FALSE, 'Unauthorized: cannot modify another user''s data'::TEXT;
    RETURN;
  END IF;

  -- Get friendship and verify user is part of it
  SELECT * INTO v_friendship
  FROM friendships
  WHERE id = p_friendship_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 'Amizade não encontrada'::TEXT;
    RETURN;
  END IF;

  -- Verify user is part of this friendship
  IF v_friendship.requester_id != p_user_id AND v_friendship.addressee_id != p_user_id THEN
    RETURN QUERY SELECT FALSE, 'Você não tem permissão para remover esta amizade'::TEXT;
    RETURN;
  END IF;

  -- Delete friendship
  DELETE FROM friendships
  WHERE id = p_friendship_id;

  RETURN QUERY SELECT TRUE, 'Amizade removida com sucesso.'::TEXT;
END;
$$;