-- Create table to track claimed Pokedex rewards
CREATE TABLE IF NOT EXISTS public.pokedex_rewards_claimed (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  section TEXT NOT NULL,
  milestone INTEGER NOT NULL,
  claimed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, section, milestone)
);

-- Enable RLS
ALTER TABLE public.pokedex_rewards_claimed ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own claimed rewards"
ON public.pokedex_rewards_claimed
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own claimed rewards"
ON public.pokedex_rewards_claimed
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create function to claim pokedex reward
CREATE OR REPLACE FUNCTION claim_pokedex_reward(
  p_user_id UUID,
  p_section TEXT,
  p_milestone INTEGER,
  p_coins INTEGER,
  p_xp INTEGER,
  p_shards INTEGER
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_already_claimed BOOLEAN;
BEGIN
  -- Check if already claimed
  SELECT EXISTS(
    SELECT 1 FROM pokedex_rewards_claimed
    WHERE user_id = p_user_id
    AND section = p_section
    AND milestone = p_milestone
  ) INTO v_already_claimed;

  IF v_already_claimed THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Recompensa já coletada!'
    );
  END IF;

  -- Insert claimed record
  INSERT INTO pokedex_rewards_claimed (user_id, section, milestone)
  VALUES (p_user_id, p_section, p_milestone);

  -- Update user profile with rewards
  UPDATE profiles
  SET 
    pokecoins = pokecoins + p_coins,
    experience_points = experience_points + p_xp,
    pokeshards = pokeshards + p_shards,
    updated_at = now()
  WHERE user_id = p_user_id;

  RETURN json_build_object(
    'success', true,
    'message', 'Recompensa coletada com sucesso!'
  );
END;
$$;