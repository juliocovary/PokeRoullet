CREATE OR REPLACE FUNCTION public.claim_daily_login(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_record user_daily_logins%ROWTYPE;
  v_today date := current_date;
  v_yesterday date := current_date - 1;
  v_new_streak int;
  v_day int;
  v_reward_type text;
  v_reward_amount int;
  v_is_legendary boolean := false;
BEGIN
  SELECT * INTO v_record FROM user_daily_logins WHERE user_id = p_user_id;

  IF v_record.last_claim_date = v_today THEN
    RETURN jsonb_build_object('success', false, 'message', 'already_claimed', 'current_streak', v_record.current_streak);
  END IF;

  IF v_record IS NULL OR v_record.last_claim_date IS NULL OR v_record.last_claim_date < v_yesterday THEN
    v_new_streak := 1;
  ELSIF v_record.current_streak >= 7 THEN
    v_new_streak := 1;
  ELSE
    v_new_streak := v_record.current_streak + 1;
  END IF;

  v_day := v_new_streak;

  CASE v_day
    WHEN 1 THEN v_reward_type := 'pokecoins'; v_reward_amount := 110;
    WHEN 2 THEN v_reward_type := 'spins'; v_reward_amount := 5;
    WHEN 3 THEN v_reward_type := 'pokeshards'; v_reward_amount := 25;
    WHEN 4 THEN v_reward_type := 'pokecoins'; v_reward_amount := 220;
    WHEN 5 THEN v_reward_type := 'spins'; v_reward_amount := 10;
    WHEN 6 THEN v_reward_type := 'pokeshards'; v_reward_amount := 60;
    WHEN 7 THEN v_reward_type := 'legendary_spin'; v_reward_amount := 1; v_is_legendary := true;
    ELSE v_reward_type := 'pokecoins'; v_reward_amount := 110;
  END CASE;

  INSERT INTO user_daily_logins (user_id, current_streak, last_claim_date, total_logins, updated_at)
  VALUES (p_user_id, v_new_streak, v_today, 1, now())
  ON CONFLICT (user_id) DO UPDATE SET
    current_streak = v_new_streak,
    last_claim_date = v_today,
    total_logins = user_daily_logins.total_logins + 1,
    updated_at = now();

  IF v_reward_type = 'pokecoins' THEN
    UPDATE profiles SET pokecoins = pokecoins + v_reward_amount, updated_at = now() WHERE user_id = p_user_id;
  ELSIF v_reward_type = 'spins' THEN
    NULL;
  ELSIF v_reward_type = 'pokeshards' THEN
    UPDATE profiles SET pokeshards = pokeshards + v_reward_amount, updated_at = now() WHERE user_id = p_user_id;
  ELSIF v_reward_type = 'legendary_spin' THEN
    NULL;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'day', v_day,
    'current_streak', v_new_streak,
    'reward_type', v_reward_type,
    'reward_amount', v_reward_amount,
    'is_legendary_spin', v_is_legendary
  );
END;
$$;