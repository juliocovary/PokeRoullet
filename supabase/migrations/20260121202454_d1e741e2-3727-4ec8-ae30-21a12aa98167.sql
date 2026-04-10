-- Adicionar coluna para rastrear último claim do bônus afiliado
ALTER TABLE user_spins 
ADD COLUMN last_affiliate_claim_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Criar RPC function segura para claim de bonus spins por afiliado
CREATE OR REPLACE FUNCTION claim_affiliate_bonus_spins()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_last_claim TIMESTAMP WITH TIME ZONE;
  v_hours_since_claim NUMERIC;
  v_new_spins INTEGER;
  v_next_claim_at TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Obter user_id do token de autenticação
  v_user_id := auth.uid();
  
  -- Validação de autenticação
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'unauthorized',
      'message', 'Usuário não autenticado'
    );
  END IF;

  -- Buscar último claim e verificar cooldown
  SELECT last_affiliate_claim_at INTO v_last_claim
  FROM user_spins
  WHERE user_id = v_user_id;

  -- Se não encontrou registro de spins
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'no_spins_record',
      'message', 'Registro de spins não encontrado'
    );
  END IF;

  -- Calcular horas desde o último claim
  IF v_last_claim IS NOT NULL THEN
    v_hours_since_claim := EXTRACT(EPOCH FROM (now() - v_last_claim)) / 3600;
    
    IF v_hours_since_claim < 8 THEN
      v_next_claim_at := v_last_claim + INTERVAL '8 hours';
      RETURN jsonb_build_object(
        'success', false,
        'error', 'cooldown_active',
        'message', 'Aguarde o cooldown',
        'next_claim_at', v_next_claim_at,
        'hours_remaining', ROUND((8 - v_hours_since_claim)::numeric, 2)
      );
    END IF;
  END IF;

  -- Atualizar spins e timestamp (operação atômica)
  UPDATE user_spins
  SET 
    free_spins = free_spins + 5,
    last_affiliate_claim_at = now(),
    updated_at = now()
  WHERE user_id = v_user_id
  RETURNING free_spins INTO v_new_spins;

  v_next_claim_at := now() + INTERVAL '8 hours';

  RETURN jsonb_build_object(
    'success', true,
    'message', '+5 giros adicionados!',
    'new_spin_count', v_new_spins,
    'next_claim_at', v_next_claim_at
  );
END;
$$;

-- Criar função para verificar status do cooldown do afiliado
CREATE OR REPLACE FUNCTION get_affiliate_bonus_status()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_last_claim TIMESTAMP WITH TIME ZONE;
  v_hours_since_claim NUMERIC;
  v_next_claim_at TIMESTAMP WITH TIME ZONE;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'can_claim', false,
      'error', 'unauthorized'
    );
  END IF;

  SELECT last_affiliate_claim_at INTO v_last_claim
  FROM user_spins
  WHERE user_id = v_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'can_claim', false,
      'error', 'no_spins_record'
    );
  END IF;

  -- Se nunca coletou, pode coletar
  IF v_last_claim IS NULL THEN
    RETURN jsonb_build_object(
      'can_claim', true,
      'next_claim_at', NULL
    );
  END IF;

  v_hours_since_claim := EXTRACT(EPOCH FROM (now() - v_last_claim)) / 3600;
  
  IF v_hours_since_claim >= 8 THEN
    RETURN jsonb_build_object(
      'can_claim', true,
      'next_claim_at', NULL
    );
  ELSE
    v_next_claim_at := v_last_claim + INTERVAL '8 hours';
    RETURN jsonb_build_object(
      'can_claim', false,
      'next_claim_at', v_next_claim_at,
      'hours_remaining', ROUND((8 - v_hours_since_claim)::numeric, 2)
    );
  END IF;
END;
$$;