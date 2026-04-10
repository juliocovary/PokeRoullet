-- Função para verificar e resetar giros gratuitos se passaram 2 horas
CREATE OR REPLACE FUNCTION public.check_and_reset_free_spins(p_user_id uuid)
RETURNS TABLE(free_spins integer, last_spin_reset timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Verificar se o usuário tem 0 giros e se passaram 2 horas desde o último reset
  UPDATE public.user_spins 
  SET 
    free_spins = 5,
    last_spin_reset = now()
  WHERE 
    user_id = p_user_id 
    AND free_spins = 0 
    AND (now() - last_spin_reset) >= interval '2 hours';
  
  -- Retornar os dados atualizados do usuário
  RETURN QUERY
  SELECT us.free_spins, us.last_spin_reset
  FROM public.user_spins us
  WHERE us.user_id = p_user_id;
END;
$$;