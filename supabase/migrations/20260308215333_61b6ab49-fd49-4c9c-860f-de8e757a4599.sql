
-- Daily login tracking table
CREATE TABLE public.user_daily_logins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  current_streak integer NOT NULL DEFAULT 0,
  last_claim_date date,
  total_logins integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_daily_logins ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own daily logins"
  ON public.user_daily_logins FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- RPC function to claim daily login reward
CREATE OR REPLACE FUNCTION public.claim_daily_login(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_record user_daily_logins%ROWTYPE;
  v_today date := CURRENT_DATE;
  v_yesterday date := CURRENT_DATE - 1;
  v_new_streak integer;
  v_reward_type text;
  v_reward_amount integer;
  v_is_legendary_spin boolean := false;
  v_reward_badge_name text;
BEGIN
  -- Get or create record
  SELECT * INTO v_record FROM user_daily_logins WHERE user_id = p_user_id;
  
  IF v_record IS NULL THEN
    INSERT INTO user_daily_logins (user_id, current_streak, last_claim_date, total_logins)
    VALUES (p_user_id, 0, NULL, 0)
    RETURNING * INTO v_record;
  END IF;

  -- Check if already claimed today
  IF v_record.last_claim_date = v_today THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'already_claimed',
      'current_streak', v_record.current_streak,
      'last_claim_date', v_record.last_claim_date
    );
  END IF;

  -- Calculate new streak
  IF v_record.last_claim_date = v_yesterday THEN
    -- Consecutive day
    v_new_streak := v_record.current_streak + 1;
    IF v_new_streak > 7 THEN
      v_new_streak := 1; -- Reset after completing 7 days
    END IF;
  ELSE
    -- Missed a day or first login, start at day 1
    v_new_streak := 1;
  END IF;

  -- Determine reward based on streak day
  CASE v_new_streak
    WHEN 1 THEN
      v_reward_type := 'pokecoins';
      v_reward_amount := 500;
    WHEN 2 THEN
      v_reward_type := 'spins';
      v_reward_amount := 2;
    WHEN 3 THEN
      v_reward_type := 'pokeshards';
      v_reward_amount := 50;
    WHEN 4 THEN
      v_reward_type := 'pokecoins';
      v_reward_amount := 1000;
    WHEN 5 THEN
      v_reward_type := 'spins';
      v_reward_amount := 3;
    WHEN 6 THEN
      v_reward_type := 'pokeshards';
      v_reward_amount := 100;
    WHEN 7 THEN
      v_reward_type := 'legendary_spin';
      v_reward_amount := 1;
      v_is_legendary_spin := true;
    ELSE
      v_reward_type := 'pokecoins';
      v_reward_amount := 500;
  END CASE;

  -- Grant reward
  IF v_reward_type = 'pokecoins' THEN
    UPDATE profiles SET pokecoins = pokecoins + v_reward_amount, updated_at = now()
    WHERE user_id = p_user_id;
  ELSIF v_reward_type = 'pokeshards' THEN
    UPDATE profiles SET pokeshards = pokeshards + v_reward_amount, updated_at = now()
    WHERE user_id = p_user_id;
  ELSIF v_reward_type = 'spins' THEN
    UPDATE user_spins SET free_spins = free_spins + v_reward_amount, updated_at = now()
    WHERE user_id = p_user_id;
  ELSIF v_reward_type = 'legendary_spin' THEN
    -- Add legendary spin item (item_id for legendary spin ticket)
    INSERT INTO user_items (user_id, item_id, quantity)
    VALUES (p_user_id, 300, 1)
    ON CONFLICT (user_id, item_id) DO UPDATE SET quantity = user_items.quantity + 1, updated_at = now();
  END IF;

  -- Update streak record
  UPDATE user_daily_logins
  SET current_streak = v_new_streak,
      last_claim_date = v_today,
      total_logins = total_logins + 1,
      updated_at = now()
  WHERE user_id = p_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'day', v_new_streak,
    'reward_type', v_reward_type,
    'reward_amount', v_reward_amount,
    'is_legendary_spin', v_is_legendary_spin,
    'current_streak', v_new_streak
  );
END;
$$;

-- Insert legendary spin ticket item if not exists
INSERT INTO public.items (id, name, description, type, price, icon_url)
VALUES (300, 'Giro Lendário', 'Um ticket especial que garante um Pokémon Lendário!', 'legendary_spin', 0, '⭐')
ON CONFLICT (id) DO NOTHING;
