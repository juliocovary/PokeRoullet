-- Criar função para descontar spins de forma segura (SECURITY DEFINER)
-- Esta função é necessária porque a tabela user_spins não permite UPDATE direto via RLS

CREATE OR REPLACE FUNCTION public.deduct_multi_spins(p_user_id uuid, p_spins_to_deduct integer)
RETURNS TABLE(
  success boolean,
  remaining_spins integer,
  spins_deducted integer,
  message text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_spins integer;
  v_actual_deduct integer;
BEGIN
  -- Obter spins atuais do servidor (proteção contra race conditions)
  SELECT free_spins INTO v_current_spins
  FROM user_spins
  WHERE user_id = p_user_id
  FOR UPDATE; -- Lock the row to prevent concurrent updates
  
  IF v_current_spins IS NULL THEN
    RETURN QUERY SELECT false, 0, 0, 'User spins not found'::text;
    RETURN;
  END IF;
  
  IF v_current_spins <= 0 THEN
    RETURN QUERY SELECT false, 0, 0, 'No free spins available'::text;
    RETURN;
  END IF;
  
  -- Calcular quantos spins realmente descontar (máximo disponível)
  v_actual_deduct := LEAST(p_spins_to_deduct, v_current_spins);
  
  -- Atualizar spins
  UPDATE user_spins
  SET 
    free_spins = free_spins - v_actual_deduct,
    updated_at = now()
  WHERE user_id = p_user_id;
  
  RETURN QUERY SELECT 
    true, 
    (v_current_spins - v_actual_deduct)::integer, 
    v_actual_deduct::integer, 
    'Spins deducted successfully'::text;
END;
$$;