-- Adicionar 400 giros para a conta de teste PokeJulio
UPDATE public.user_spins 
SET free_spins = 400, 
    last_spin_reset = now(),
    updated_at = now()
WHERE user_id = 'c94e79c3-d242-4adc-991c-705123b5b640';