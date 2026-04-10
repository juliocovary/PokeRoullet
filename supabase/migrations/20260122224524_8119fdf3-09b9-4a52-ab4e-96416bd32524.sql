-- Create table for equipped badges (3 slots per user)
CREATE TABLE public.user_equipped_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  slot_1_item_id INTEGER REFERENCES public.items(id),
  slot_2_item_id INTEGER REFERENCES public.items(id),
  slot_3_item_id INTEGER REFERENCES public.items(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_equipped_badges ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own equipped badges"
  ON public.user_equipped_badges FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own equipped badges"
  ON public.user_equipped_badges FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own equipped badges"
  ON public.user_equipped_badges FOR UPDATE
  USING (auth.uid() = user_id);

-- RPC: Equip a badge to a specific slot (with validation)
CREATE OR REPLACE FUNCTION public.equip_badge(
  p_slot INTEGER,
  p_item_id INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_has_badge BOOLEAN;
  v_is_badge BOOLEAN;
  v_already_equipped BOOLEAN;
BEGIN
  -- Get authenticated user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'unauthorized');
  END IF;

  -- Validate slot number
  IF p_slot NOT IN (1, 2, 3) THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_slot');
  END IF;

  -- If equipping (not removing), validate user owns the badge
  IF p_item_id IS NOT NULL THEN
    -- Check if item is a badge type
    SELECT EXISTS(
      SELECT 1 FROM items WHERE id = p_item_id AND type = 'badge'
    ) INTO v_is_badge;
    
    IF NOT v_is_badge THEN
      RETURN jsonb_build_object('success', false, 'error', 'not_a_badge');
    END IF;

    -- Check if user owns the badge
    SELECT EXISTS(
      SELECT 1 FROM user_items
      WHERE user_id = v_user_id 
      AND item_id = p_item_id 
      AND quantity > 0
    ) INTO v_has_badge;
    
    IF NOT v_has_badge THEN
      RETURN jsonb_build_object('success', false, 'error', 'badge_not_owned');
    END IF;

    -- Check if badge is already equipped in another slot
    SELECT EXISTS(
      SELECT 1 FROM user_equipped_badges
      WHERE user_id = v_user_id
      AND (
        (p_slot != 1 AND slot_1_item_id = p_item_id) OR
        (p_slot != 2 AND slot_2_item_id = p_item_id) OR
        (p_slot != 3 AND slot_3_item_id = p_item_id)
      )
    ) INTO v_already_equipped;

    IF v_already_equipped THEN
      RETURN jsonb_build_object('success', false, 'error', 'already_equipped');
    END IF;
  END IF;

  -- Upsert the equipped badges record
  INSERT INTO user_equipped_badges (user_id)
  VALUES (v_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  -- Update the specific slot
  CASE p_slot
    WHEN 1 THEN 
      UPDATE user_equipped_badges 
      SET slot_1_item_id = p_item_id, updated_at = now() 
      WHERE user_id = v_user_id;
    WHEN 2 THEN 
      UPDATE user_equipped_badges 
      SET slot_2_item_id = p_item_id, updated_at = now() 
      WHERE user_id = v_user_id;
    WHEN 3 THEN 
      UPDATE user_equipped_badges 
      SET slot_3_item_id = p_item_id, updated_at = now() 
      WHERE user_id = v_user_id;
  END CASE;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- RPC: Get total badge buffs for a user
CREATE OR REPLACE FUNCTION public.get_badge_buffs()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_xp_bonus NUMERIC := 0;
  v_luck_bonus NUMERIC := 0;
  v_shiny_bonus NUMERIC := 0;
  v_secret_active BOOLEAN := false;
  v_slot_1 INTEGER;
  v_slot_2 INTEGER;
  v_slot_3 INTEGER;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'xp_bonus', 0, 
      'luck_bonus', 0, 
      'shiny_bonus', 0,
      'secret_active', false
    );
  END IF;

  -- Get equipped badges
  SELECT slot_1_item_id, slot_2_item_id, slot_3_item_id
  INTO v_slot_1, v_slot_2, v_slot_3
  FROM user_equipped_badges
  WHERE user_id = v_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'xp_bonus', 0, 
      'luck_bonus', 0, 
      'shiny_bonus', 0,
      'secret_active', false
    );
  END IF;

  -- Calculate buffs based on badge IDs
  -- ID 200 = XP Badge (+15% XP)
  -- ID 201 = Luck Badge (+10% Luck)
  -- ID 202 = Shiny Badge (+0.5% shiny chance)
  -- ID 203 = Secret Badge (+50% secret rarity chance)

  -- Check slot 1
  CASE v_slot_1
    WHEN 200 THEN v_xp_bonus := v_xp_bonus + 0.15;
    WHEN 201 THEN v_luck_bonus := v_luck_bonus + 0.10;
    WHEN 202 THEN v_shiny_bonus := v_shiny_bonus + 0.005;
    WHEN 203 THEN v_secret_active := true;
    ELSE NULL;
  END CASE;

  -- Check slot 2
  CASE v_slot_2
    WHEN 200 THEN v_xp_bonus := v_xp_bonus + 0.15;
    WHEN 201 THEN v_luck_bonus := v_luck_bonus + 0.10;
    WHEN 202 THEN v_shiny_bonus := v_shiny_bonus + 0.005;
    WHEN 203 THEN v_secret_active := true;
    ELSE NULL;
  END CASE;

  -- Check slot 3
  CASE v_slot_3
    WHEN 200 THEN v_xp_bonus := v_xp_bonus + 0.15;
    WHEN 201 THEN v_luck_bonus := v_luck_bonus + 0.10;
    WHEN 202 THEN v_shiny_bonus := v_shiny_bonus + 0.005;
    WHEN 203 THEN v_secret_active := true;
    ELSE NULL;
  END CASE;

  RETURN jsonb_build_object(
    'xp_bonus', v_xp_bonus,
    'luck_bonus', v_luck_bonus,
    'shiny_bonus', v_shiny_bonus,
    'secret_active', v_secret_active
  );
END;
$$;

-- RPC: Get equipped badges for display
CREATE OR REPLACE FUNCTION public.get_equipped_badges()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_result JSONB;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('slot_1', null, 'slot_2', null, 'slot_3', null);
  END IF;

  SELECT jsonb_build_object(
    'slot_1', CASE WHEN ueb.slot_1_item_id IS NOT NULL THEN jsonb_build_object(
      'id', i1.id,
      'name', i1.name,
      'description', i1.description,
      'icon_url', i1.icon_url
    ) ELSE null END,
    'slot_2', CASE WHEN ueb.slot_2_item_id IS NOT NULL THEN jsonb_build_object(
      'id', i2.id,
      'name', i2.name,
      'description', i2.description,
      'icon_url', i2.icon_url
    ) ELSE null END,
    'slot_3', CASE WHEN ueb.slot_3_item_id IS NOT NULL THEN jsonb_build_object(
      'id', i3.id,
      'name', i3.name,
      'description', i3.description,
      'icon_url', i3.icon_url
    ) ELSE null END
  )
  INTO v_result
  FROM user_equipped_badges ueb
  LEFT JOIN items i1 ON i1.id = ueb.slot_1_item_id
  LEFT JOIN items i2 ON i2.id = ueb.slot_2_item_id
  LEFT JOIN items i3 ON i3.id = ueb.slot_3_item_id
  WHERE ueb.user_id = v_user_id;

  IF v_result IS NULL THEN
    RETURN jsonb_build_object('slot_1', null, 'slot_2', null, 'slot_3', null);
  END IF;

  RETURN v_result;
END;
$$;