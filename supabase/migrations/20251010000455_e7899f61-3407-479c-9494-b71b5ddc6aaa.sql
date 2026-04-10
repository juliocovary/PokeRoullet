-- Add luck_multiplier and xp_multiplier columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS luck_multiplier numeric DEFAULT 1.0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS xp_multiplier numeric DEFAULT 1.0;

-- Create function to increase luck multiplier
CREATE OR REPLACE FUNCTION increase_luck_multiplier(p_user_id uuid, p_percentage numeric)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE profiles 
  SET luck_multiplier = luck_multiplier * (1 + p_percentage / 100),
      updated_at = now()
  WHERE user_id = p_user_id;
  
  RETURN FOUND;
END;
$function$;

-- Create function to increase XP multiplier
CREATE OR REPLACE FUNCTION increase_xp_multiplier(p_user_id uuid, p_percentage numeric)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE profiles 
  SET xp_multiplier = xp_multiplier * (1 + p_percentage / 100),
      updated_at = now()
  WHERE user_id = p_user_id;
  
  RETURN FOUND;
END;
$function$;