-- Table to track daily gifts between friends
CREATE TABLE public.friend_gifts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL,
  receiver_id UUID NOT NULL,
  friendship_id UUID NOT NULL REFERENCES public.friendships(id) ON DELETE CASCADE,
  reward_type TEXT NOT NULL, -- 'spins', 'coins', 'shards', 'legendary_spin'
  reward_amount INTEGER NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  claimed_at TIMESTAMP WITH TIME ZONE,
  is_claimed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.friend_gifts ENABLE ROW LEVEL SECURITY;

-- Users can see gifts they sent or received
CREATE POLICY "Users can view their own gifts"
ON public.friend_gifts
FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Index for faster queries
CREATE INDEX idx_friend_gifts_receiver ON public.friend_gifts(receiver_id, is_claimed);
CREATE INDEX idx_friend_gifts_sender_date ON public.friend_gifts(sender_id, sent_at);

-- Function to send daily gift to a friend
CREATE OR REPLACE FUNCTION public.send_daily_gift(p_user_id UUID, p_friend_id UUID, p_friendship_id UUID)
RETURNS TABLE(success BOOLEAN, message TEXT, reward_type TEXT, reward_amount INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_random NUMERIC;
  v_reward_type TEXT;
  v_reward_amount INTEGER;
  v_last_gift TIMESTAMPTZ;
  v_friendship_exists BOOLEAN;
BEGIN
  -- Auth validation
  IF p_user_id != auth.uid() THEN
    RETURN QUERY SELECT FALSE, 'Não autorizado'::TEXT, NULL::TEXT, NULL::INTEGER;
    RETURN;
  END IF;
  
  -- Check if friendship exists and is accepted
  SELECT EXISTS(
    SELECT 1 FROM friendships 
    WHERE id = p_friendship_id 
    AND status = 'accepted'
    AND ((requester_id = p_user_id AND addressee_id = p_friend_id) 
         OR (requester_id = p_friend_id AND addressee_id = p_user_id))
  ) INTO v_friendship_exists;
  
  IF NOT v_friendship_exists THEN
    RETURN QUERY SELECT FALSE, 'Amizade não encontrada'::TEXT, NULL::TEXT, NULL::INTEGER;
    RETURN;
  END IF;
  
  -- Check if already sent gift today to this friend
  SELECT sent_at INTO v_last_gift
  FROM friend_gifts
  WHERE sender_id = p_user_id 
    AND receiver_id = p_friend_id
    AND sent_at::date = CURRENT_DATE;
  
  IF v_last_gift IS NOT NULL THEN
    RETURN QUERY SELECT FALSE, 'Você já enviou um presente para este amigo hoje!'::TEXT, NULL::TEXT, NULL::INTEGER;
    RETURN;
  END IF;
  
  -- Generate random reward based on chances:
  -- 3 spins: 40%, 15 coins: 30%, 5 pokeshards: 20%, 5 spins: 9.99%, 1 legendary spin: 0.01%
  v_random := random() * 100;
  
  IF v_random < 0.01 THEN
    -- 0.01% - Legendary spin
    v_reward_type := 'legendary_spin';
    v_reward_amount := 1;
  ELSIF v_random < 10 THEN
    -- 9.99% - 5 spins
    v_reward_type := 'spins';
    v_reward_amount := 5;
  ELSIF v_random < 30 THEN
    -- 20% - 5 pokeshards
    v_reward_type := 'shards';
    v_reward_amount := 5;
  ELSIF v_random < 60 THEN
    -- 30% - 15 coins
    v_reward_type := 'coins';
    v_reward_amount := 15;
  ELSE
    -- 40% - 3 spins
    v_reward_type := 'spins';
    v_reward_amount := 3;
  END IF;
  
  -- Insert the gift
  INSERT INTO friend_gifts (sender_id, receiver_id, friendship_id, reward_type, reward_amount)
  VALUES (p_user_id, p_friend_id, p_friendship_id, v_reward_type, v_reward_amount);
  
  RETURN QUERY SELECT TRUE, 'Presente enviado com sucesso!'::TEXT, v_reward_type, v_reward_amount;
END;
$$;

-- Function to claim a received gift
CREATE OR REPLACE FUNCTION public.claim_friend_gift(p_user_id UUID, p_gift_id UUID)
RETURNS TABLE(success BOOLEAN, message TEXT, reward_type TEXT, reward_amount INTEGER, sender_nickname TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_gift RECORD;
  v_sender_nickname TEXT;
BEGIN
  -- Auth validation
  IF p_user_id != auth.uid() THEN
    RETURN QUERY SELECT FALSE, 'Não autorizado'::TEXT, NULL::TEXT, NULL::INTEGER, NULL::TEXT;
    RETURN;
  END IF;
  
  -- Get gift with lock
  SELECT * INTO v_gift
  FROM friend_gifts
  WHERE id = p_gift_id AND receiver_id = p_user_id AND is_claimed = FALSE
  FOR UPDATE;
  
  IF v_gift IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Presente não encontrado ou já foi coletado'::TEXT, NULL::TEXT, NULL::INTEGER, NULL::TEXT;
    RETURN;
  END IF;
  
  -- Get sender nickname
  SELECT nickname INTO v_sender_nickname
  FROM profiles
  WHERE user_id = v_gift.sender_id;
  
  -- Apply reward based on type
  IF v_gift.reward_type = 'spins' THEN
    UPDATE user_spins
    SET free_spins = free_spins + v_gift.reward_amount, updated_at = now()
    WHERE user_id = p_user_id;
  ELSIF v_gift.reward_type = 'coins' THEN
    UPDATE profiles
    SET pokecoins = pokecoins + v_gift.reward_amount, updated_at = now()
    WHERE user_id = p_user_id;
  ELSIF v_gift.reward_type = 'shards' THEN
    UPDATE profiles
    SET pokeshards = pokeshards + v_gift.reward_amount, updated_at = now()
    WHERE user_id = p_user_id;
  ELSIF v_gift.reward_type = 'legendary_spin' THEN
    -- Add legendary spin item (item_id = 52)
    INSERT INTO user_items (user_id, item_id, quantity)
    VALUES (p_user_id, 52, v_gift.reward_amount)
    ON CONFLICT (user_id, item_id) 
    DO UPDATE SET quantity = user_items.quantity + v_gift.reward_amount, updated_at = now();
  END IF;
  
  -- Mark gift as claimed
  UPDATE friend_gifts
  SET is_claimed = TRUE, claimed_at = now()
  WHERE id = p_gift_id;
  
  RETURN QUERY SELECT TRUE, 'Presente coletado!'::TEXT, v_gift.reward_type, v_gift.reward_amount, v_sender_nickname;
END;
$$;

-- Function to get pending gifts for a user
CREATE OR REPLACE FUNCTION public.get_pending_gifts(p_user_id UUID)
RETURNS TABLE(
  gift_id UUID,
  sender_id UUID,
  sender_nickname TEXT,
  sender_avatar TEXT,
  reward_type TEXT,
  reward_amount INTEGER,
  sent_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Auth validation
  IF p_user_id != auth.uid() THEN
    RETURN;
  END IF;
  
  RETURN QUERY
  SELECT 
    fg.id as gift_id,
    fg.sender_id,
    p.nickname as sender_nickname,
    p.avatar as sender_avatar,
    fg.reward_type,
    fg.reward_amount,
    fg.sent_at
  FROM friend_gifts fg
  JOIN profiles p ON p.user_id = fg.sender_id
  WHERE fg.receiver_id = p_user_id AND fg.is_claimed = FALSE
  ORDER BY fg.sent_at DESC;
END;
$$;

-- Function to check if user can send gift to friend today
CREATE OR REPLACE FUNCTION public.can_send_gift_today(p_user_id UUID, p_friend_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Auth validation
  IF p_user_id != auth.uid() THEN
    RETURN FALSE;
  END IF;
  
  RETURN NOT EXISTS(
    SELECT 1 FROM friend_gifts
    WHERE sender_id = p_user_id 
      AND receiver_id = p_friend_id
      AND sent_at::date = CURRENT_DATE
  );
END;
$$;

-- Function to get friend's pokedex for viewing
CREATE OR REPLACE FUNCTION public.get_friend_pokedex(p_user_id UUID, p_friend_id UUID)
RETURNS TABLE(
  pokemon_id INTEGER,
  pokemon_name TEXT,
  is_shiny BOOLEAN,
  placed_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_is_friend BOOLEAN;
BEGIN
  -- Auth validation
  IF p_user_id != auth.uid() THEN
    RETURN;
  END IF;
  
  -- Check if they are friends
  SELECT EXISTS(
    SELECT 1 FROM friendships 
    WHERE status = 'accepted'
    AND ((requester_id = p_user_id AND addressee_id = p_friend_id) 
         OR (requester_id = p_friend_id AND addressee_id = p_user_id))
  ) INTO v_is_friend;
  
  IF NOT v_is_friend THEN
    RETURN;
  END IF;
  
  RETURN QUERY
  SELECT 
    pc.pokemon_id,
    pc.pokemon_name,
    pc.is_shiny,
    pc.placed_at
  FROM pokedex_cards pc
  WHERE pc.user_id = p_friend_id
  ORDER BY pc.pokemon_id ASC;
END;
$$;